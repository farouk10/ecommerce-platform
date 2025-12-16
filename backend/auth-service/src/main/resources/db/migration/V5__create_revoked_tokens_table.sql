-- Create table for revoked refresh tokens
CREATE TABLE revoked_tokens (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(500) NOT NULL UNIQUE,
    user_id UUID NOT NULL,
    revoked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reason VARCHAR(50),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
-- Create indexes for performance
CREATE INDEX idx_token ON revoked_tokens(token);
CREATE INDEX idx_user_id ON revoked_tokens(user_id);
CREATE INDEX idx_revoked_at ON revoked_tokens(revoked_at);
-- Add comment
COMMENT ON TABLE revoked_tokens IS 'Tracks revoked refresh tokens for security';
COMMENT ON COLUMN revoked_tokens.reason IS 'Revocation reason: LOGOUT, PASSWORD_CHANGE, SECURITY_BREACH';