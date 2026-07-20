const { PrismaClient } = require('../src/generated/product')

const prisma = new PrismaClient()

const categories = [
  { name: 'Brake System', slug: 'brake-system', icon: '🛞' },
  { name: 'Engine Parts', slug: 'engine-parts', icon: '⚙️' },
  { name: 'Suspension', slug: 'suspension', icon: '🔧' },
  { name: 'Electrical', slug: 'electrical', icon: '⚡' },
  { name: 'Transmission', slug: 'transmission', icon: '🔩' },
  { name: 'Exhaust', slug: 'exhaust', icon: '💨' },
  { name: 'Filters', slug: 'filters', icon: '🌬️' },
  { name: 'Lighting', slug: 'lighting', icon: '💡' },
]

const products = [
  // Brake System
  { name: 'Front Brake Pads (Ceramic)', brand: 'Bosch', price: 42.99, categorySlug: 'brake-system', vehicleType: 'car', description: 'Premium ceramic front brake pads for smooth, quiet stopping. Fits most sedans and SUVs.', stock: 45 },
  { name: 'Rear Brake Disc Rotor', brand: 'Brembo', price: 89.50, categorySlug: 'brake-system', vehicleType: 'car', description: 'Vented rear disc rotor, 280mm diameter. OEM-spec replacement.', stock: 20 },
  { name: 'Brake Caliper (Front Left)', brand: 'Delphi', price: 134.00, categorySlug: 'brake-system', vehicleType: 'car', description: 'Remanufactured front brake caliper with new seals and boots.', stock: 8 },
  { name: 'Motorcycle Brake Pads (Semi-Metallic)', brand: 'EBC', price: 18.99, categorySlug: 'brake-system', vehicleType: 'bike', description: 'Semi-metallic organic brake pads for sport and commuter bikes.', stock: 60 },
  { name: 'Brake Fluid DOT 4 (500ml)', brand: 'Motul', price: 12.50, categorySlug: 'brake-system', vehicleType: 'both', description: 'High-performance DOT 4 brake fluid. Dry boiling point 312°C.', stock: 120 },

  // Engine Parts
  { name: 'Air Filter (Panel)', brand: 'K&N', price: 24.99, categorySlug: 'engine-parts', vehicleType: 'car', description: 'Washable high-flow air filter. Increases horsepower by up to 4%.', stock: 80 },
  { name: 'Spark Plug Set (Iridium)', brand: 'NGK', price: 32.00, categorySlug: 'engine-parts', vehicleType: 'car', description: 'Set of 4 iridium spark plugs. Pre-gapped, 60,000 mile lifespan.', stock: 100 },
  { name: 'Oil Filter (Spin-On)', brand: 'Mann', price: 8.99, categorySlug: 'engine-parts', vehicleType: 'car', description: 'Premium oil filter with anti-drain-back valve. Fits most European and Asian cars.', stock: 200 },
  { name: 'Piston Ring Set', brand: 'Mahle', price: 78.00, categorySlug: 'engine-parts', vehicleType: 'car', description: 'Complete piston ring set for engine rebuilds. Standard size.', stock: 15 },
  { name: 'Motorcycle Chain 520', brand: 'RK', price: 35.00, categorySlug: 'engine-parts', vehicleType: 'bike', description: '520 pitch motorcycle chain, 120 links. Sealed O-ring design.', stock: 40 },

  // Suspension
  { name: 'Front Shock Absorber', brand: 'Monroe', price: 65.00, categorySlug: 'suspension', vehicleType: 'car', description: 'Gas-charged twin-tube shock absorber. Improves ride comfort and handling.', stock: 30 },
  { name: 'Lower Ball Joint', brand: 'Moog', price: 28.50, categorySlug: 'suspension', vehicleType: 'car', description: 'Greaseable ball joint for front suspension. Enhanced durability.', stock: 50 },
  { name: 'Fork Seal Kit (35mm)', brand: 'All Balls', price: 15.99, categorySlug: 'suspension', vehicleType: 'bike', description: 'Complete fork seal kit. Includes oil seals, dust seals, and bushings.', stock: 35 },

  // Electrical
  { name: 'Car Battery 12V 60Ah', brand: 'Exide', price: 129.99, categorySlug: 'electrical', vehicleType: 'car', description: 'Maintenance-free lead-acid battery. 3-year warranty.', stock: 25 },
  { name: 'Starter Motor', brand: 'Bosch', price: 185.00, categorySlug: 'electrical', vehicleType: 'car', description: 'Remanufactured starter motor. 1.4kW output.', stock: 10 },
  { name: 'Alternator 14V 120A', brand: 'Denso', price: 210.00, categorySlug: 'electrical', vehicleType: 'car', description: 'Remanufactured alternator. Direct-fit replacement.', stock: 8 },
  { name: 'LED Headlight Bulb H4', brand: 'Philips', price: 29.99, categorySlug: 'electrical', vehicleType: 'both', description: 'UltraVision LED bulb, 6500K white. 160% more brightness.', stock: 90 },

  // Transmission
  { name: 'Manual Transmission Fluid (1L)', brand: 'Red Line', price: 18.50, categorySlug: 'transmission', vehicleType: 'car', description: 'MT-90 full synthetic gear oil. Improves shift feel.', stock: 65 },
  { name: 'Clutch Kit (3-Piece)', brand: 'Sachs', price: 245.00, categorySlug: 'transmission', vehicleType: 'car', description: 'Complete clutch kit: disc, pressure plate, and throw-out bearing.', stock: 12 },

  // Exhaust
  { name: 'Catalytic Converter (Universal)', brand: 'Walker', price: 159.99, categorySlug: 'exhaust', vehicleType: 'car', description: 'Universal-fit catalytic converter. EPA compliant.', stock: 18 },
  { name: 'Exhaust Muffler (Stainless)', brand: 'MagnaFlow', price: 199.00, categorySlug: 'exhaust', vehicleType: 'car', description: 'Stainless steel muffler. Deep, smooth exhaust tone.', stock: 14 },

  // Filters
  { name: 'Cabin Air Filter (Activated Carbon)', brand: 'Mann', price: 14.99, categorySlug: 'filters', vehicleType: 'car', description: 'Activated carbon cabin filter. Blocks pollen, dust, and odors.', stock: 75 },
  { name: 'Fuel Filter (Inline)', brand: 'Bosch', price: 11.50, categorySlug: 'filters', vehicleType: 'car', description: 'Inline fuel filter. 10-micron filtration.', stock: 55 },

  // Lighting
  { name: 'LED Tail Light (Right)', brand: 'Helix', price: 55.00, categorySlug: 'lighting', vehicleType: 'car', description: 'Direct-fit LED tail light assembly. Plug and play.', stock: 22 },
  { name: 'LED Fog Light Pair', brand: 'Auxbeam', price: 34.99, categorySlug: 'lighting', vehicleType: 'both', description: '6000K white LED fog lights. Waterproof IP67.', stock: 40 },
]

async function main() {
  console.log('Seeding product database...')

  // Create categories
  const categoryMap = {}
  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    })
    categoryMap[cat.slug] = created.id
    console.log(`  Category: ${cat.name}`)
  }

  // Create products
  for (const p of products) {
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const existing = await prisma.product.findUnique({ where: { slug } })
    if (!existing) {
      await prisma.product.create({
        data: {
          name: p.name,
          slug,
          description: p.description,
          brand: p.brand,
          price: p.price,
          categoryId: categoryMap[p.categorySlug],
          vehicleType: p.vehicleType,
          compatibleVehicles: JSON.stringify([]),
          stock: p.stock,
        },
      })
      console.log(`  Product: ${p.name}`)
    }
  }

  console.log('Product seed complete.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
