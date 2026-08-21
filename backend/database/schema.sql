-- =============================================================================
-- PostgreSQL Schema: Skin Disease AI E-Commerce Product & Recommendation Database
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. Table: Product
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    expiry_date VARCHAR(50) DEFAULT '12/2027',
    brand_id UUID,
    brand VARCHAR(100) DEFAULT '',
    category_id UUID,
    category VARCHAR(100) DEFAULT '',
    description TEXT DEFAULT '',
    image VARCHAR(500) DEFAULT '',
    
    -- Medical & AI Recommendation Fields
    main_ingredients TEXT[] DEFAULT '{}',
    ingredient_tags TEXT[] DEFAULT '{}',
    skin_type_tags TEXT[] DEFAULT '{}',
    skin_conditions_supported TEXT[] DEFAULT '{}',
    skin_conditions_not_supported TEXT[] DEFAULT '{}',
    
    -- Usage & Protocol
    usage TEXT DEFAULT '',
    morning_use BOOLEAN DEFAULT TRUE,
    night_use BOOLEAN DEFAULT TRUE,
    requires_sunscreen BOOLEAN DEFAULT FALSE,
    usage_steps TEXT DEFAULT '',
    usage_frequency VARCHAR(100) DEFAULT '1 lần / ngày',
    
    -- Safety & Age Suitability
    pregnancy_safe BOOLEAN DEFAULT TRUE,
    children_safe BOOLEAN DEFAULT FALSE,
    recommended_age VARCHAR(50) DEFAULT '12+',
    contraindications TEXT DEFAULT '',
    medical_warning TEXT DEFAULT '',
    
    -- Formulas & Interactivity
    compatible_ingredients TEXT[] DEFAULT '{}',
    incompatible_ingredients TEXT[] DEFAULT '{}',
    benefits TEXT[] DEFAULT '{}',
    
    -- Formula Attributes
    oil_free BOOLEAN DEFAULT FALSE,
    fragrance_free BOOLEAN DEFAULT TRUE,
    alcohol_free BOOLEAN DEFAULT TRUE,
    paraben_free BOOLEAN DEFAULT TRUE,
    comedogenic_level INT DEFAULT 0 CHECK (comedogenic_level BETWEEN 0 AND 5),
    texture VARCHAR(50) DEFAULT 'Serum',
    product_type VARCHAR(50) DEFAULT 'Treatment',
    
    -- AI Priority & Recommendations
    ai_priority_score INT DEFAULT 50 CHECK (ai_priority_score BETWEEN 1 AND 100),
    ai_recommendation_reason TEXT DEFAULT '',
    
    -- E-Commerce Extensions
    flash_sale_price DECIMAL(12, 2) DEFAULT NULL,
    flash_sale_end_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    has_variants BOOLEAN DEFAULT FALSE,
    prescription_required BOOLEAN DEFAULT FALSE,
    origin_country VARCHAR(100) DEFAULT 'Việt Nam',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_priority ON products(ai_priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_products_skin_conditions ON products USING GIN(skin_conditions_supported);
CREATE INDEX IF NOT EXISTS idx_products_ingredient_tags ON products USING GIN(ingredient_tags);


-- -----------------------------------------------------------------------------
-- 2. Table: Ingredient
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) UNIQUE NOT NULL,
    description TEXT DEFAULT '',
    benefits TEXT[] DEFAULT '{}',
    mechanism TEXT DEFAULT '',
    recommended_for TEXT[] DEFAULT '{}',
    avoid_for TEXT[] DEFAULT '{}',
    compatible_with TEXT[] DEFAULT '{}',
    not_compatible_with TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);


-- -----------------------------------------------------------------------------
-- 3. Table: DiseaseProductMapping
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS disease_product_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    disease_id VARCHAR(100) NOT NULL, -- e.g., "KB_001", "Acne", "Eczema"
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    priority INT NOT NULL DEFAULT 50 CHECK (priority BETWEEN 1 AND 100),
    reason TEXT NOT NULL,
    recommended_stage VARCHAR(100) DEFAULT 'All Stages',
    morning BOOLEAN DEFAULT TRUE,
    night BOOLEAN DEFAULT TRUE,
    confidence DECIMAL(3, 2) DEFAULT 0.90,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_disease_mapping_disease ON disease_product_mappings(disease_id, priority DESC);


-- -----------------------------------------------------------------------------
-- 4. Table: DiseaseIngredient
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS disease_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    disease_id VARCHAR(100) NOT NULL,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    ingredient_name VARCHAR(150) NOT NULL,
    priority INT NOT NULL DEFAULT 50 CHECK (priority BETWEEN 1 AND 100),
    recommended BOOLEAN DEFAULT TRUE,
    avoid BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_disease_ingredients_disease ON disease_ingredients(disease_id, priority DESC);
