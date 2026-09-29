import "dotenv/config";
import bcrypt from "bcryptjs";
import { closeMongo, db } from "../src/config/mongo.js";


const roles = [
  "SUPER_ADMIN",
  "ADMIN_ESTABLISHMENT",
  "MANAGER",
  "WAITER",
  "CASHIER",
  "KITCHEN",
  "BAR",
  "CLIENT"
];

async function main() {
  for (const role of roles) {
    await db.role.upsert({
      where: { name: role },
      update: {},
      create: { name: role, description: role.replaceAll("_", " ") }
    });
  }

  const adminRole = await db.role.findUnique({ where: { name: "SUPER_ADMIN" } });

  const establishment = await db.establishment.upsert({
    where: { slug: "maison-cafe" },
    update: {
      name: "Maison Cafe",
      type: "CAFE_RESTAURANT",
      address: "Avenue Mohammed V, Casablanca",
      phone: "+212600000000",
      email: "contact@maisoncafe.ma",
      primaryColor: "#c8a24a",
      isActive: true
    },
    create: {
      name: "Maison Cafe",
      slug: "maison-cafe",
      type: "CAFE_RESTAURANT",
      address: "Avenue Mohammed V, Casablanca",
      phone: "+212600000000",
      email: "contact@maisoncafe.ma",
      primaryColor: "#c8a24a"
    }
  });

  await db.user.upsert({
    where: { email: "admin@demo.com" },
    update: {
      name: "Super Admin",
      roleId: adminRole.id,
      roleName: "SUPER_ADMIN",
      establishmentId: establishment.id,
      isActive: true
    },
    create: {
      name: "Super Admin",
      email: "admin@demo.com",
      password: await bcrypt.hash("Password123", 12),
      roleId: adminRole.id,
      roleName: "SUPER_ADMIN",
      establishmentId: establishment.id
    }
  });

  const demoUsers = [
    { name: "Omar Tazi", email: "manager@demo.com", roleName: "MANAGER" },
    { name: "Sara El Mansouri", email: "serveur@demo.com", roleName: "WAITER" },
    { name: "Mina Berrada", email: "caissier@demo.com", roleName: "CASHIER" },
    { name: "Youssef Amrani", email: "cuisine@demo.com", roleName: "KITCHEN" },
    { name: "Nadia Barista", email: "bar@demo.com", roleName: "BAR" },
    { name: "Client Demo", email: "client@demo.com", roleName: "CLIENT" }
  ];

  for (const demoUser of demoUsers) {
    const role = await db.role.findUnique({ where: { name: demoUser.roleName } });
    const user = await db.user.upsert({
      where: { email: demoUser.email },
      update: {
        name: demoUser.name,
        roleId: role.id,
        roleName: demoUser.roleName,
        establishmentId: establishment.id,
        isActive: true
      },
      create: {
        name: demoUser.name,
        email: demoUser.email,
        password: await bcrypt.hash("Password123", 12),
        roleId: role.id,
        roleName: demoUser.roleName,
        establishmentId: establishment.id
      }
    });

    if (["MANAGER", "WAITER", "CASHIER", "KITCHEN", "BAR"].includes(demoUser.roleName)) {
      await db.employee.upsert({
        where: { userId: user.id },
        update: {
          establishmentId: establishment.id,
          position: demoUser.roleName,
          isActive: true
        },
        create: {
          userId: user.id,
          establishmentId: establishment.id,
          position: demoUser.roleName,
          isActive: true
        }
      });
    }
  }

  const categories = ["Ftours", "Plats", "Boissons chaudes", "Boissons froides", "Desserts", "Snacks", "Pizzas"];
  for (const [index, name] of categories.entries()) {
    await db.category.upsert({
      where: { id: index + 1 },
      update: {
        name,
        sortOrder: index,
        isActive: true,
        establishmentId: establishment.id
      },
      create: {
        name,
        sortOrder: index,
        establishmentId: establishment.id
      }
    });
  }

  const categoryRecords = await db.category.findMany({ where: { establishmentId: establishment.id } });
  const categoryByName = Object.fromEntries(categoryRecords.map((category) => [category.name, category]));
  const image = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;
  const menuProducts = [
    {
      name: "Ftour Sefrioui",
      description: "Pain traditionnel, huile d'olive, olives, fromage frais, oeufs beldi, miel et the marocain.",
      price: 55,
      preparationTime: 12,
      tva: 10,
      categoryId: categoryByName.Ftours.id,
      image: image("photo-1533089860892-a7c6f0a88666")
    },
    {
      name: "Ftour Fassi",
      description: "Msemen, harcha, amlou, fromage, olives, oeuf, confiture maison et the a la menthe.",
      price: 62,
      preparationTime: 14,
      tva: 10,
      categoryId: categoryByName.Ftours.id,
      image: image("photo-1525351484163-7529414344d8")
    },
    {
      name: "Ftour Chamali",
      description: "Pain maison, jben, huile d'olive, olives noires, omelette khlii et boisson chaude.",
      price: 68,
      preparationTime: 15,
      tva: 10,
      categoryId: categoryByName.Ftours.id,
      image: image("photo-1513442542250-854d436a73f2")
    },
    {
      name: "Ftour Atlas",
      description: "Baghrir, miel, beurre beldi, amlou, dattes, yaourt nature et cafe ou the.",
      price: 58,
      preparationTime: 13,
      tva: 10,
      categoryId: categoryByName.Ftours.id,
      image: image("photo-1493770348161-369560ae357d")
    },
    {
      name: "Tajine poulet citron",
      description: "Poulet fermier, olives, citron confit et epices douces.",
      price: 78,
      preparationTime: 22,
      tva: 10,
      categoryId: categoryByName.Plats.id,
      image: image("photo-1541518763669-27fef04b14ea")
    },
    {
      name: "Couscous royal",
      description: "Semoule fine, legumes de saison, poulet, merguez et bouillon maison.",
      price: 95,
      preparationTime: 28,
      tva: 10,
      categoryId: categoryByName.Plats.id,
      image: image("photo-1585937421612-70a008356fbe")
    },
    {
      name: "Pasta crevettes",
      description: "Linguine, crevettes sautees, ail, persil et sauce creme citronnee.",
      price: 82,
      preparationTime: 18,
      tva: 10,
      categoryId: categoryByName.Plats.id,
      image: image("photo-1551183053-bf91a1d81141")
    },
    {
      name: "Espresso signature",
      description: "Extraction courte, notes cacao et noisette.",
      price: 18,
      preparationTime: 4,
      tva: 10,
      categoryId: categoryByName["Boissons chaudes"].id,
      image: image("photo-1514432324607-a09d9b4aefdd")
    },
    {
      name: "Cafe noir",
      description: "Cafe arabica intense, servi court ou allonge selon preference.",
      price: 14,
      preparationTime: 3,
      tva: 10,
      categoryId: categoryByName["Boissons chaudes"].id,
      image: image("photo-1495474472287-4d71bcdd2085")
    },
    {
      name: "The marocain",
      description: "The vert, menthe fraiche et sucre dose a la marocaine.",
      price: 18,
      preparationTime: 6,
      tva: 10,
      categoryId: categoryByName["Boissons chaudes"].id,
      image: image("photo-1564890369478-c89ca6d9cde9")
    },
    {
      name: "Jus d'orange",
      description: "Orange fraiche pressee minute.",
      price: 28,
      preparationTime: 5,
      tva: 10,
      categoryId: categoryByName["Boissons froides"].id,
      image: image("photo-1621506289937-a8e4df240d0b")
    },
    {
      name: "Smoothie avocat",
      description: "Avocat, lait, amandes et touche de miel.",
      price: 36,
      preparationTime: 7,
      tva: 10,
      categoryId: categoryByName["Boissons froides"].id,
      image: image("photo-1553530666-ba11a7da3888")
    },
    {
      name: "Cheesecake caramel",
      description: "Base biscuit, creme fromage et coulis caramel beurre sale.",
      price: 42,
      preparationTime: 5,
      tva: 10,
      categoryId: categoryByName.Desserts.id,
      image: image("photo-1533134242443-d4fd215305ad")
    },
    {
      name: "Fondant chocolat",
      description: "Coeur chocolat coulant, servi tiede.",
      price: 39,
      preparationTime: 10,
      tva: 10,
      categoryId: categoryByName.Desserts.id,
      image: image("photo-1606313564200-e75d5e30476c")
    },
    {
      name: "Club sandwich poulet",
      description: "Pain toast, poulet grille, oeuf, crudites et sauce maison.",
      price: 54,
      preparationTime: 12,
      tva: 10,
      categoryId: categoryByName.Snacks.id,
      image: image("photo-1553909489-cd47e0907980")
    },
    {
      name: "Pizza margarita",
      description: "Tomate, mozzarella, basilic et huile d'olive.",
      price: 62,
      preparationTime: 16,
      tva: 10,
      categoryId: categoryByName.Pizzas.id,
      image: image("photo-1604068549290-dea0e4a305ca")
    },
    {
      name: "Pizza fruits de mer",
      description: "Sauce tomate, mozzarella, crevettes, calamars et persillade.",
      price: 88,
      preparationTime: 18,
      tva: 10,
      categoryId: categoryByName.Pizzas.id,
      image: image("photo-1594007654729-407eedc4be65")
    }
  ];

  for (const product of menuProducts) {
    await db.product.upsert({
      where: { name: product.name, establishmentId: establishment.id },
      update: {
        ...product,
        establishmentId: establishment.id,
        isAvailable: true
      },
      create: {
        ...product,
        establishmentId: establishment.id,
        isAvailable: true
      }
    });
  }

  const products = await db.product.findMany({ where: { establishmentId: establishment.id } });
  for (const product of products) {
    await db.product.update({
      where: { id: product.id },
      data: {
        isAvailable: product.isAvailable ?? true,
        preparationTime: product.preparationTime ?? 10,
        tva: product.tva ?? 10
      }
    });
  }

  const seededTables = await db.diningTable.findMany({ where: { establishmentId: establishment.id } });
  for (const table of seededTables) {
    await db.diningTable.update({
      where: { id: table.id },
      data: { status: table.status || "FREE" }
    });
  }

  await db.diningTable.createMany({
    data: [
      { number: "T01", capacity: 4, zone: "Terrasse", establishmentId: establishment.id },
      { number: "T02", capacity: 2, zone: "Interieur", establishmentId: establishment.id },
      { number: "VIP 1", capacity: 8, zone: "Salon VIP", establishmentId: establishment.id }
    ],
    skipDuplicates: true
  });

  await db.stock.createMany({
    data: [
      { name: "Cafe arabica", supplierName: "Atlas Beans", quantity: 8, unit: "kg", alertThreshold: 5, cost: 145, establishmentId: establishment.id },
      { name: "Mozzarella", supplierName: "Casa Fresh", quantity: 2, unit: "kg", alertThreshold: 4, cost: 72, establishmentId: establishment.id },
      { name: "Avocat", supplierName: "Primeur Anfa", quantity: 0, unit: "caisse", alertThreshold: 2, cost: 180, establishmentId: establishment.id },
      { name: "Farine", supplierName: "Moulin Maroc", quantity: 18, unit: "kg", alertThreshold: 8, cost: 9, establishmentId: establishment.id }
    ],
    skipDuplicates: true
  });

  const reservations = await db.reservation.findMany({ where: { establishmentId: establishment.id } });
  for (const reservation of reservations) {
    if (reservation.customerId || !reservation.customerName) continue;
    const existingCustomer = reservation.phone
      ? await db.customer.findFirst({ where: { phone: reservation.phone, establishmentId: establishment.id } })
      : null;
    const customer = existingCustomer
      ? await db.customer.update({
          where: { id: existingCustomer.id },
          data: { name: reservation.customerName, phone: reservation.phone || null }
        })
      : await db.customer.create({
          data: {
            name: reservation.customerName,
            phone: reservation.phone || null,
            establishmentId: establishment.id
          }
        });
    await db.reservation.update({
      where: { id: reservation.id },
      data: { customerId: customer.id }
    });
  }

  await seedSectorDemos();
}

// Comptes demo pour d'autres secteurs (type "CAFE" = modules caisse/produits/stock/clients sans salle).
const sectorDemos = [
  {
    name: "Parapharmacie Atlas",
    slug: "parapharmacie-atlas",
    address: "Boulevard Zerktouni, Casablanca",
    phone: "+212600000101",
    email: "contact@parapharmacie-atlas.ma",
    primaryColor: "#2f9e8f",
    adminEmail: "parapharmacie@demo.com",
    adminName: "Admin Parapharmacie",
    categories: {
      "Soins visage": [
        ["Creme hydratante 50ml", "Hydratation 24h peaux normales a seches.", 89, 20],
        ["Serum vitamine C", "Eclat et anti-taches, flacon 30ml.", 149, 20]
      ],
      "Hygiene": [
        ["Gel douche doux 400ml", "Sans savon, peaux sensibles.", 39, 20],
        ["Dentifrice blancheur", "Tube 75ml au fluor.", 32, 20]
      ],
      "Bebe et maman": [
        ["Lait de toilette bebe", "Flacon 500ml hypoallergenique.", 59, 20],
        ["Creme change 100g", "Protege et apaise.", 45, 20]
      ],
      "Complements": [
        ["Magnesium B6", "Boite de 60 comprimes.", 79, 20],
        ["Vitamine D3", "Flacon 30ml gouttes.", 65, 20]
      ]
    },
    stock: [
      ["Creme hydratante 50ml", "Lab Derma", 24, "boite", 10, 55],
      ["Serum vitamine C", "Lab Derma", 3, "flacon", 6, 95],
      ["Magnesium B6", "NutriPharma", 40, "boite", 12, 42]
    ]
  },
  {
    name: "Ecole Privee Al Amal",
    slug: "ecole-privee-al-amal",
    address: "Rue Ibn Sina, Rabat",
    phone: "+212600000202",
    email: "contact@ecole-al-amal.ma",
    primaryColor: "#3b5bdb",
    adminEmail: "ecole@demo.com",
    adminName: "Directeur Ecole Al Amal",
    categories: {
      "Scolarite": [
        ["Frais mensuels Primaire", "Scolarite mensuelle cycle primaire.", 1200, 0],
        ["Frais mensuels College", "Scolarite mensuelle cycle college.", 1500, 0],
        ["Frais d'inscription", "Inscription annuelle.", 2500, 0]
      ],
      "Services": [
        ["Transport scolaire mensuel", "Ramassage matin et soir.", 400, 0],
        ["Cantine mensuelle", "Dejeuner 20 jours.", 500, 0]
      ],
      "Fournitures": [
        ["Pack fournitures Primaire", "Cahiers, stylos, trousse.", 350, 20],
        ["Uniforme scolaire", "Blouse + polo.", 280, 20]
      ]
    },
    stock: [
      ["Pack fournitures Primaire", "Papeterie Centrale", 60, "pack", 15, 250],
      ["Uniforme scolaire", "Textile Rabat", 8, "piece", 10, 180]
    ]
  }
];

async function seedSectorDemos() {
  const adminRole = await db.role.findUnique({ where: { name: "ADMIN_ESTABLISHMENT" } });

  for (const demo of sectorDemos) {
    const data = {
      name: demo.name,
      type: "CAFE",
      address: demo.address,
      phone: demo.phone,
      email: demo.email,
      primaryColor: demo.primaryColor
    };
    const establishment = await db.establishment.upsert({
      where: { slug: demo.slug },
      update: { ...data, isActive: true },
      create: { ...data, slug: demo.slug }
    });

    await db.user.upsert({
      where: { email: demo.adminEmail },
      update: {
        name: demo.adminName,
        roleId: adminRole.id,
        roleName: "ADMIN_ESTABLISHMENT",
        establishmentId: establishment.id,
        isActive: true
      },
      create: {
        name: demo.adminName,
        email: demo.adminEmail,
        password: await bcrypt.hash("Password123", 12),
        roleId: adminRole.id,
        roleName: "ADMIN_ESTABLISHMENT",
        establishmentId: establishment.id
      }
    });

    let sortOrder = 0;
    for (const [categoryName, items] of Object.entries(demo.categories)) {
      let category = await db.category.findFirst({ where: { name: categoryName, establishmentId: establishment.id } });
      if (!category) {
        category = await db.category.create({
          data: { name: categoryName, sortOrder: sortOrder, establishmentId: establishment.id }
        });
      }
      sortOrder += 1;

      for (const [name, description, price, tva] of items) {
        const product = { name, description, price, tva, preparationTime: 0, categoryId: category.id };
        await db.product.upsert({
          where: { name, establishmentId: establishment.id },
          update: { ...product, establishmentId: establishment.id, isAvailable: true },
          create: { ...product, establishmentId: establishment.id, isAvailable: true }
        });
      }
    }

    await db.stock.createMany({
      data: demo.stock.map(([name, supplierName, quantity, unit, alertThreshold, cost]) => ({
        name, supplierName, quantity, unit, alertThreshold, cost, establishmentId: establishment.id
      })),
      skipDuplicates: true
    });
  }
}

main()
  .then(async () => {
    await closeMongo();
  })
  .catch(async (error) => {
    console.error(error);
    await closeMongo();
    process.exit(1);
  });
