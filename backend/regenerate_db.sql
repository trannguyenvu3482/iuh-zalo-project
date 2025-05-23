-- SQL script to regenerate database with updated schema
-- This script will drop and recreate all tables with the new schema requirements

-- First, terminate all connections to the database
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'YOUR_DATABASE_NAME'  -- Replace with your database name
AND pid <> pg_backend_pid();

-- Drop existing tables (if they exist) to avoid conflicts
DROP TABLE IF EXISTS reactions;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS conversation_members;
DROP TABLE IF EXISTS conversations;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS friendships;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS users;

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "phoneNumber" VARCHAR(15) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  fullName VARCHAR(50) NOT NULL,
  gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
  birthdate DATE,
  avatar VARCHAR(255) DEFAULT 'https://via.placeholder.com/150?text=User',
  banner VARCHAR(255) DEFAULT 'https://via.placeholder.com/1200x300?text=Banner',
  status VARCHAR(10) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create roles table
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create user_roles junction table
CREATE TABLE user_roles (
  "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
  "roleId" INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("userId", "roleId")
);

-- Create friendships table
CREATE TABLE friendships (
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "friendId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(10) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("userId", "friendId")
);

-- Create conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255),
  type VARCHAR(10) NOT NULL DEFAULT 'PRIVATE' CHECK (type IN ('PRIVATE', 'GROUP')),
  avatar VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create conversation_members junction table
CREATE TABLE conversation_members (
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "conversationId" UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(10) NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('CREATOR', 'ADMIN', 'MEMBER')),
  nickname VARCHAR(50),
  PRIMARY KEY ("userId", "conversationId")
);

-- Create messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message TEXT NOT NULL,
  sender UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver UUID REFERENCES users(id) ON DELETE SET NULL,
  "conversationId" UUID REFERENCES conversations(id) ON DELETE CASCADE,
  "group" INTEGER,
  edited BOOLEAN NOT NULL DEFAULT FALSE,
  file VARCHAR(255),
  "replyToId" UUID REFERENCES messages(id) ON DELETE SET NULL,
  "isSystemMessage" BOOLEAN DEFAULT FALSE,
  "systemEventType" VARCHAR(20) CHECK ("systemEventType" IN (
    'MEMBERS_ADDED', 
    'MEMBER_REMOVED', 
    'GROUP_CREATED', 
    'NICKNAME_CHANGED', 
    'CHAT_CLEARED', 
    'GROUP_LEFT',
    'GROUP_DELETED',
    'FRIEND_CONNECTED'
  )),
  "read" BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create reactions table
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(10) NOT NULL CHECK (type IN ('LIKE', 'HEART', 'LAUGH', 'WOW', 'SAD', 'ANGRY')),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "messageId" UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Insert initial roles
INSERT INTO roles (name) VALUES ('user'), ('moderator'), ('admin');

-- Create indexes for better performance
CREATE INDEX idx_user_phone ON users("phoneNumber");
CREATE INDEX idx_message_conversation ON messages("conversationId");
CREATE INDEX idx_message_sender ON messages(sender);
CREATE INDEX idx_conversation_member_user ON conversation_members("userId");
CREATE INDEX idx_conversation_member_conversation ON conversation_members("conversationId");
CREATE INDEX idx_system_messages ON messages("isSystemMessage");

-- Grant RLS permissions for the service role if using Supabase
-- Comment out or remove this section if not using Supabase
/*
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role to access all tables
CREATE POLICY service_role_access ON users FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_access ON roles FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_access ON user_roles FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_access ON friendships FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_access ON conversations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_access ON conversation_members FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_access ON messages FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_access ON reactions FOR ALL USING (auth.role() = 'service_role');
*/

-- Script to run this file:
-- INSTRUCTIONS:
-- 1. Connect to your PostgreSQL server
-- 2. Execute this script with:
--    psql -U YOUR_USERNAME -d YOUR_DATABASE_NAME -f regenerate_db.sql 