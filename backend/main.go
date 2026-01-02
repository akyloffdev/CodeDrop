package main

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	gonanoid "github.com/matoous/go-nanoid/v2"
	"github.com/redis/go-redis/v9"
)

type Paste struct {
	ID        string    `json:"id"`
	Content   string    `json:"content"`
	Language  string    `json:"language"`
	CreatedAt time.Time `json:"created_at"`
	ExpiresAt time.Time `json:"expires_at"`
}

type CreatePasteRequest struct {
	Content    string `json:"content" binding:"required"`
	Language   string `json:"language" binding:"required"`
	TTLSeconds int    `json:"ttl_seconds" binding:"required"`
}

var (
	db  *pgxpool.Pool
	rdb *redis.Client
)

const (
	MaxContentSize = 1024 * 1024
	MinTTL         = 60
	MaxTTL         = 31536000
	SecurityHeader = "X-CodeDrop-Token"
	SecurityValue  = "secure-access-v1"
)

func ipBanMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method == http.MethodOptions {
			c.Next()
			return
		}

		clientIP := c.ClientIP()
		banKey := "ban:" + clientIP
		ctx := c.Request.Context()

		isBanned, _ := rdb.Exists(ctx, banKey).Result()
		if isBanned > 0 {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Your IP is temporarily banned"})
			return
		}

		if c.Request.Method == http.MethodPost && c.FullPath() == "/api/pastes" {
			if c.GetHeader(SecurityHeader) != SecurityValue {
				rdb.Set(ctx, banKey, "1", 24*time.Hour)
				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Unauthorized request. IP banned."})
				return
			}
		}

		c.Next()
	}
}

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	redisURL := os.Getenv("REDIS_URL")
	port := os.Getenv("PORT")
	if port == "" {
		port = "10000"
	}

	dbConfig, err := pgxpool.ParseConfig(dbURL)
	if err != nil {
		log.Fatal(err)
	}
	db, err = pgxpool.NewWithConfig(context.Background(), dbConfig)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		log.Fatal(err)
	}
	rdb = redis.NewClient(opt)

	go func() {
		ticker := time.NewTicker(1 * time.Hour)
		for range ticker.C {
			db.Exec(context.Background(), "DELETE FROM pastes WHERE expires_at < NOW()")
		}
	}()

	r := gin.New()
	r.Use(gin.Recovery())
	
	allowedOrigin := os.Getenv("ALLOWED_ORIGIN")
	corsConfig := cors.Config{
		AllowMethods:     []string{"GET", "POST", "OPTIONS", "PUT", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", SecurityHeader},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}

	if allowedOrigin == "" || allowedOrigin == "*" {
		corsConfig.AllowAllOrigins = true
		corsConfig.AllowCredentials = false
	} else {
		corsConfig.AllowOrigins = []string{allowedOrigin}
	}

	r.Use(cors.New(corsConfig))
	r.Use(ipBanMiddleware())

	api := r.Group("/api")
	{
		api.POST("/pastes", createPaste)
		api.GET("/pastes/:id", getPaste)
	}

	createTableQuery := `
	CREATE TABLE IF NOT EXISTS pastes (
		short_id VARCHAR(10) PRIMARY KEY,
		content TEXT NOT NULL,
		language VARCHAR(50) NOT NULL,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
		expires_at TIMESTAMP WITH TIME ZONE NOT NULL
	);
	CREATE INDEX IF NOT EXISTS idx_expires_at ON pastes(expires_at);
	`
	_, err = db.Exec(context.Background(), createTableQuery)
	if err != nil {
		log.Fatal(err)
	}

	r.Run(":" + port)
}

func createPaste(c *gin.Context) {
	var req CreatePasteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(req.Content) > MaxContentSize {
		c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "Content too large"})
		return
	}

	if req.TTLSeconds < MinTTL || req.TTLSeconds > MaxTTL {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid TTL"})
		return
	}

	alphabet := "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
	shortID, _ := gonanoid.Generate(alphabet, 8)

	expiresAt := time.Now().Add(time.Duration(req.TTLSeconds) * time.Second)

	query := `INSERT INTO pastes (short_id, content, language, expires_at) VALUES ($1, $2, $3, $4)`
	if _, err := db.Exec(c.Request.Context(), query, shortID, req.Content, req.Language, expiresAt); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": shortID})
}

func getPaste(c *gin.Context) {
	id := c.Param("id")
	if len(id) > 10 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	ctx := c.Request.Context()
	cached, err := rdb.Get(ctx, "paste:"+id).Bytes()
	if err == nil {
		var p Paste
		if err := json.Unmarshal(cached, &p); err == nil {
			c.JSON(http.StatusOK, p)
			return
		}
	}

	var p Paste
	query := `SELECT short_id, content, language, created_at, expires_at FROM pastes WHERE short_id = $1 AND expires_at > NOW()`
	if err := db.QueryRow(ctx, query, id).Scan(&p.ID, &p.Content, &p.Language, &p.CreatedAt, &p.ExpiresAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Paste not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	ttl := time.Until(p.ExpiresAt)
	if ttl > 0 {
		marshaled, _ := json.Marshal(p)
		rdb.Set(ctx, "paste:"+id, marshaled, ttl)
	}
	
	c.JSON(http.StatusOK, p)
}
