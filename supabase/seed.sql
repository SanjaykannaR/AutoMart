-- ================================================================
-- AutoMart — Seed Data (Products + Inventory)
-- Run in Supabase SQL Editor after setup.sql
-- ================================================================
-- Categories must already exist (from setup.sql)
-- Products use INR (₹) pricing for Indian market
-- ================================================================


-- ─── PRODUCTS ────────────────────────────────────────────────────────────────
-- 25 auto parts across 8 categories
-- Category IDs are resolved via subqueries (no hardcoded UUIDs)

-- ── Brake Parts (5 products) ─────────────────────────────────────────────────

INSERT INTO products (name, slug, description, brand, price, image_url, category_id, vehicle_type, compatible_vehicles, specifications, stock)
SELECT
  'Ceramic Brake Pads (Front)',
  'ceramic-brake-pads-front',
  'Premium ceramic front brake pads for smooth, quiet stopping. Low dust formula with excellent heat dissipation. Fits most Indian sedans and SUVs.',
  'Bosch',
  1499.00,
  'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop',
  (SELECT id FROM categories WHERE slug = 'brake-parts'),
  'car',
  '[]'::jsonb,
  '{"material": "Ceramic", "position": "Front", "warranty": "2 years", "fitment": "Universal Indian cars"}'::jsonb,
  45
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'ceramic-brake-pads-front');

INSERT INTO products (name, slug, description, brand, price, image_url, category_id, vehicle_type, compatible_vehicles, specifications, stock)
SELECT
  'Disc Brake Rotor (Rear)',
  'disc-brake-rotor-rear',
  'Vented rear disc rotor, 280mm diameter. OEM-spec replacement with anti-corrosion coating.',
  'Brembo',
  3499.00,
  'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop',
  (SELECT id FROM categories WHERE slug = 'brake-parts'),
  'car',
  '[]'::jsonb,
  '{"diameter": "280mm", "type": "Vented", "coating": "Anti-corrosion"}'::jsonb,
  20
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'disc-brake-rotor-rear');

INSERT INTO products (name, slug, description, brand, price, image_url, category_id, vehicle_type, compatible_vehicles, specifications, stock)
SELECT
  'Brake Caliper (Front Left)',
  'brake-caliper-front-left',
  'Remanufactured front brake caliper with new seals and boots. Direct bolt-on replacement.',
  'Delphi',
  5999.00,
  'https://images.unsplash.com/photo-1504215680853-026ed2a45def?w=400&h=300&fit=crop',
  (SELECT id FROM categories WHERE slug = 'brake-parts'),
  'car',
  '[]'::jsonb,
  '{"position": "Front Left", "type": "Remanufactured", "includes": "Seals + Boots"}'::jsonb,
  8
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'brake-caliper-front-left');

INSERT INTO products (name, slug, description, brand, price, image_url, category_id, vehicle_type, compatible_vehicles, specifications, stock)
SELECT
  'Motorcycle Brake Pads (Semi-Metallic)',
  'motorcycle-brake-pads-semi-metallic',
  'Semi-metallic organic brake pads for sport and commuter bikes. Excellent wet and dry performance.',
  'EBC',
  799.00,
  'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&h=300&fit=crop',
  (SELECT id FROM categories WHERE slug = 'brake-parts'),
  'bike',
  '[]'::jsonb,
  '{"material": "Semi-Metallic", "position": "Front", "warranty": "1 year"}'::jsonb,
  60
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'motorcycle-brake-pads-semi-metallic');

INSERT INTO products (name, slug, description, brand, price, image_url, category_id, vehicle_type, compatible_vehicles, specifications, stock)
SELECT
  'Brake Fluid DOT 4 (500ml)',
  'brake-fluid-dot-4-500ml',
  'High-performance DOT 4 brake fluid. Dry boiling point 312°C. Compatible with all Indian car and bike brake systems.',
  'Motul',
  449.00,
  'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=400&h=300&fit=crop',
  (SELECT id FROM categories WHERE slug = 'brake-parts'),
  'both',
  '[]'::jsonb,
  '{"spec": "DOT 4", "volume": "500ml", "boiling_point": "312°C"}'::jsonb,
  120
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'brake-fluid-dot-4-500ml');


-- ── Engine Parts (5 products) ────────────────────────────────────────────────

INSERT INTO products (name, slug, description, brand, price, image_url, category_id, vehicle_type, compatible_vehicles, specifications, stock)
SELECT
  'Air Filter (Panel)',
  'air-filter-panel',
  'Washable high-flow air filter. Increases horsepower by up to 4%. Reusable up to 50,000 km.',
  'K&N',
  1299.00,
  'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=400&h=300&fit=crop',
  (SELECT id FROM categories WHERE slug = 'engine-parts'),
  'car',
  '[]'::jsonb,
  '{"type": "Panel", "lifespan": "50,000 km", "washable": true}'::jsonb,
  80
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'air-filter-panel');

INSERT INTO products (name, slug, description, brand, price, image_url, category_id, vehicle_type, compatible_vehicles, specifications, stock)
SELECT
  'Spark Plug Set (Iridium) — Pack of 4',
  'spark-plug-set-iridium-4',
  'Set of 4 iridium spark plugs. Pre-gapped, 60,000 mile lifespan. Better fuel economy and smoother idle.',
  'NGK',
  1899.00,
  'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400&h=300&fit=crop',
  (SELECT id FROM categories WHERE slug = 'engine-parts'),
  'car',
  '[]'::jsonb,
  '{"electrode": "Iridium", "quantity": 4, "lifespan": "60,000 miles", "pre_gapped": true}'::jsonb,
  100
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'spark-plug-set-iridium-4');

INSERT INTO products (name, slug, description, brand, price, image_url, category_id, vehicle_type, compatible_vehicles, specifications, stock)
SELECT
  'Oil Filter (Spin-On)',
  'oil-filter-spin-on',
  'Premium oil filter with anti-drain-back valve. Fits most Indian and Japanese cars. 10-micron filtration.',
  'Mann',
  349.00,
  'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?w=400&h=300&fit=crop',
  (SELECT id FROM categories WHERE slug = 'engine-parts'),
  'car',
  '[]'::jsonb,
  '{"type": "Spin-On", "filtration": "10 micron", "anti_drain_back": true}'::jsonb,
  200
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'oil-filter-spin-on');

INSERT INTO products (name, slug, description, brand, price, image_url, category_id, vehicle_type, compatible_vehicles, specifications, stock)
SELECT
  'Piston Ring Set (Standard)',
  'piston-ring-set-standard',
  'Complete piston ring set for engine rebuilds. Standard size for most 1.0-1.6L engines.',
  'Mahle',
  3499.00,
  'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop',
  (SELECT id FROM categories WHERE slug = 'engine-parts'),
  'car',
  '[]'::jsonb,
  '{"size": "Standard", "engines": "1.0-1.6L", "pieces": "3 per piston"}'::jsonb,
  15
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'piston-ring-set-standard');

INSERT INTO products (name, slug, description, brand, price, image_url, category_id, vehicle_type, compatible_vehicles, specifications, stock)
SELECT
  'Motorcycle Chain 520 (120 Links)',
  'motorcycle-chain-520-120',
  '520 pitch motorcycle chain, 120 links. Sealed O-ring design for maximum durability.',
  'RK',
  1499.00,
  'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&h=300&fit=crop',
  (SELECT id FROM categories WHERE slug = 'engine-parts'),
  'bike',
  '[]'::jsonb,
  '{"pitch": "520", "links": 120, "seal": "O-Ring"}'::jsonb,
  40
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'motorcycle-chain-520-120');


-- ── Suspension (3 products) ──────────────────────────────────────────────────

INSERT INTO products (name, slug, description, brand, price, image_url, category_id, vehicle_type, compatible_vehicles, specifications, stock)
SELECT
  'Front Shock Absorber',
  'front-shock-absorber',
  'Gas-charged twin-tube shock absorber. Improves ride comfort and handling on Indian roads.',
  'Monroe',
  2999.00,
  'https://images.unsplash.com/photo-1504215680853-026ed2a45def?w=400&h=300&fit=crop',
  (SELECT id FROM categories WHERE slug = 'suspension'),
  'car',
  '[]'::jsonb,
  '{"type": "Gas-Charged Twin-Tube", "position": "Front", "warranty": "3 years"}'::jsonb,
  30
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'front-shock-absorber');

INSERT INTO products (name, slug, description, brand, price, image_url, category_id, vehicle_type, compatible_vehicles, specifications, stock)
SELECT
  'Lower Ball Joint',
  'lower-ball-joint',
  'Greaseable ball joint for front suspension. Enhanced durability for Indian road conditions.',
  'Moog',
  1199.00,
  'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=400&h=300&fit=crop',
  (SELECT id FROM categories WHERE slug = 'suspension'),
  'car',
  '[]'::jsonb,
  '{"type": "Greaseable", "position": "Lower Front", "material": "Forged Steel"}'::jsonb,
  50
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'lower-ball-joint');

INSERT INTO products (name, slug, description, brand, price, image_url, category_id, vehicle_type, compatible_vehicles, specifications, stock)
SELECT
  'Fork Seal Kit (35mm)',
  'fork-seal-kit-35mm',
  'Complete fork seal kit. Includes oil seals, dust seals, and bushings for 35mm forks.',
  'All Balls',
  699.00,
  'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&h=300&fit=crop',
  (SELECT id FROM categories WHERE slug = 'suspension'),
  'bike',
  '[]'::jsonb,
  '{"size": "35mm", "includes": "Oil seals + Dust seals + Bushings"}'::jsonb,
  35
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'fork-seal-kit-35mm');


-- ── Electrical (4 products) ──────────────────────────────────────────────────

INSERT INTO products (name, slug, description, brand, price, image_url, category_id, vehicle_type, compatible_vehicles, specifications, stock)
SELECT
  'Car Battery 12V 60Ah',
  'car-battery-12v-60ah',
  'Maintenance-free lead-acid battery. 3-year warranty. Ideal for most Indian sedans and hatchbacks.',
  'Exide',
  5999.00,
  'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400&h=300&fit=crop',
  (SELECT id FROM categories WHERE slug = 'electrical'),
  'car',
  '[]'::jsonb,
  '{"voltage": "12V", "capacity": "60Ah", "type": "Maintenance-Free", "warranty": "3 years"}'::jsonb,
  25
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'car-battery-12v-60ah');

INSERT INTO products (name, slug, description, brand, price, image_url, category_id, vehicle_type, compatible_vehicles, specifications, stock)
SELECT
  'Starter Motor',
  'starter-motor',
  'Remanufactured starter motor. 1.4kW output. Direct-fit replacement for most Indian cars.',
  'Bosch',
  4999.00,
  'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop',
  (SELECT id FROM categories WHERE slug = 'electrical'),
  'car',
  '[]'::jsonb,
  '{"power": "1.4kW", "type": "Remanufactured", "warranty": "2 years"}'::jsonb,
  10
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'starter-motor');

INSERT INTO products (name, slug, description, brand, price, image_url, category_id, vehicle_type, compatible_vehicles, specifications, stock)
SELECT
  'Alternator 14V 120A',
  'alternator-14v-120a',
  'Remanufactured alternator. 120A output. Direct-fit replacement for most Indian sedans.',
  'Denso',
  8999.00,
  'https://images.unsplash.com/photo-1504215680853-026ed2a45def?w=400&h=300&fit=crop',
  (SELECT id FROM categories WHERE slug = 'electrical'),
  'car',
  '[]'::jsonb,
  '{"voltage": "14V", "current": "120A", "type": "Remanufactured"}'::jsonb,
  8
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'alternator-14v-120a');

INSERT INTO products (name, slug, description, brand, price, image_url, category_id, vehicle_type, compatible_vehicles, specifications, stock)
SELECT
  'LED Headlight Bulb H4',
  'led-headlight-bulb-h4',
  'UltraVision LED bulb, 6500K white. 160% more brightness than halogen. Plug-and-play installation.',
  'Philips',
  1499.00,
  'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=400&h=300&fit=crop',
  (SELECT id FROM categories WHERE slug = 'electrical'),
  'both',
  '[]'::jsonb,
  '{"type": "LED", "color_temp": "6500K", "socket": "H4", "brightness": "160% more"}'::jsonb,
  90
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'led-headlight-bulb-h4');


-- ── Filters (2 products) ─────────────────────────────────────────────────────

INSERT INTO products (name, slug, description, brand, price, image_url, category_id, vehicle_type, compatible_vehicles, specifications, stock)
SELECT
  'Cabin Air Filter (Activated Carbon)',
  'cabin-air-filter-activated-carbon',
  'Activated carbon cabin filter. Blocks pollen, dust, and odors. Essential for Indian city driving.',
  'Mann',
  599.00,
  'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?w=400&h=300&fit=crop',
  (SELECT id FROM categories WHERE slug = 'filters'),
  'car',
  '[]'::jsonb,
  '{"type": "Activated Carbon", "blocks": "Pollen + Dust + Odors", "lifespan": "15,000 km"}'::jsonb,
  75
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'cabin-air-filter-activated-carbon');

INSERT INTO products (name, slug, description, brand, price, image_url, category_id, vehicle_type, compatible_vehicles, specifications, stock)
SELECT
  'Fuel Filter (Inline)',
  'fuel-filter-inline',
  'Inline fuel filter. 10-micron filtration. Protects fuel injectors from contaminants.',
  'Bosch',
  449.00,
  'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=400&h=300&fit=crop',
  (SELECT id FROM categories WHERE slug = 'filters'),
  'car',
  '[]'::jsonb,
  '{"type": "Inline", "filtration": "10 micron", "lifespan": "20,000 km"}'::jsonb,
  55
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'fuel-filter-inline');


-- ── Exhaust (2 products) ─────────────────────────────────────────────────────

INSERT INTO products (name, slug, description, brand, price, image_url, category_id, vehicle_type, compatible_vehicles, specifications, stock)
SELECT
  'Catalytic Converter (Universal)',
  'catalytic-converter-universal',
  'Universal-fit catalytic converter. Meets BS-VI emission standards. Stainless steel construction.',
  'Walker',
  7999.00,
  'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop',
  (SELECT id FROM categories WHERE slug = 'exhaust'),
  'car',
  '[]'::jsonb,
  '{"emission": "BS-VI", "material": "Stainless Steel", "fitment": "Universal"}'::jsonb,
  18
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'catalytic-converter-universal');

INSERT INTO products (name, slug, description, brand, price, image_url, category_id, vehicle_type, compatible_vehicles, specifications, stock)
SELECT
  'Exhaust Muffler (Stainless)',
  'exhaust-muffler-stainless',
  'Stainless steel muffler. Deep, smooth exhaust tone. Resists rust in Indian coastal climates.',
  'MagnaFlow',
  9999.00,
  'https://images.unsplash.com/photo-1504215680853-026ed2a45def?w=400&h=300&fit=crop',
  (SELECT id FROM categories WHERE slug = 'exhaust'),
  'car',
  '[]'::jsonb,
  '{"material": "Stainless Steel", "tone": "Deep + Smooth", "rust_resistant": true}'::jsonb,
  14
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'exhaust-muffler-stainless');


-- ── Lighting (2 products) ────────────────────────────────────────────────────

INSERT INTO products (name, slug, description, brand, price, image_url, category_id, vehicle_type, compatible_vehicles, specifications, stock)
SELECT
  'LED Tail Light (Right)',
  'led-tail-light-right',
  'Direct-fit LED tail light assembly. Plug and play. Instant on/off for improved safety.',
  'Helix',
  2499.00,
  'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=400&h=300&fit=crop',
  (SELECT id FROM categories WHERE slug = 'lighting'),
  'car',
  '[]'::jsonb,
  '{"type": "LED", "position": "Right Rear", "installation": "Plug and Play"}'::jsonb,
  22
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'led-tail-light-right');

INSERT INTO products (name, slug, description, brand, price, image_url, category_id, vehicle_type, compatible_vehicles, specifications, stock)
SELECT
  'LED Fog Light Pair',
  'led-fog-light-pair',
  '6000K white LED fog lights. Waterproof IP67. Essential for monsoon driving.',
  'Auxbeam',
  1499.00,
  'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400&h=300&fit=crop',
  (SELECT id FROM categories WHERE slug = 'lighting'),
  'both',
  '[]'::jsonb,
  '{"type": "LED", "color_temp": "6000K", "waterproof": "IP67", "quantity": 2}'::jsonb,
  40
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'led-fog-light-pair');


-- ── Accessories (2 products) ─────────────────────────────────────────────────

INSERT INTO products (name, slug, description, brand, price, image_url, category_id, vehicle_type, compatible_vehicles, specifications, stock)
SELECT
  'All-Weather Floor Mats (Set of 4)',
  'all-weather-floor-mats-set-4',
  'Heavy-duty rubber floor mats. Deep grooves trap mud, water, and dirt. Perfect for Indian monsoons.',
  '3D',
  1999.00,
  'https://images.unsplash.com/photo-1504215680853-026ed2a45def?w=400&h=300&fit=crop',
  (SELECT id FROM categories WHERE slug = 'accessories'),
  'car',
  '[]'::jsonb,
  '{"material": "Heavy-Duty Rubber", "quantity": 4, "waterproof": true, "anti_skid": true}'::jsonb,
  45
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'all-weather-floor-mats-set-4');

INSERT INTO products (name, slug, description, brand, price, image_url, category_id, vehicle_type, compatible_vehicles, specifications, stock)
SELECT
  'Magnetic Phone Mount',
  'magnetic-phone-mount',
  'Strong N52 magnetic phone mount. 360° rotation. Dashboard + windshield compatible.',
  'Baseus',
  799.00,
  'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400&h=300&fit=crop',
  (SELECT id FROM categories WHERE slug = 'accessories'),
  'both',
  '[]'::jsonb,
  '{"magnet": "N52", "rotation": "360°", "mount": "Dashboard + Windshield"}'::jsonb,
  80
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'magnetic-phone-mount');


-- ─── INVENTORY ───────────────────────────────────────────────────────────────
-- Auto-create inventory rows for all products (50 units each)
-- Uses the seed_inventory() function from setup.sql

SELECT seed_inventory();


-- ─── SUMMARY ─────────────────────────────────────────────────────────────────
-- Run this to verify:
-- SELECT c.name, COUNT(p.id) as product_count, SUM(p.stock) as total_stock
-- FROM products p
-- JOIN categories c ON p.category_id = c.id
-- GROUP BY c.name
-- ORDER BY c.name;
