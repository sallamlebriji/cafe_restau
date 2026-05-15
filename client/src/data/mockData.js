export const categories = [
  { id: "all", name: "Tous", icon: "Sparkles" },
  { id: "coffee", name: "Cafe", icon: "Coffee" },
  { id: "tea", name: "The", icon: "GlassWater" },
  { id: "juice", name: "Jus", icon: "CupSoda" },
  { id: "food", name: "Plats", icon: "Utensils" },
  { id: "snack", name: "Snacks", icon: "Sandwich" },
  { id: "dessert", name: "Desserts", icon: "CakeSlice" }
];

export const products = [
  { id: 1, name: "Cafe noir", category: "coffee", price: 14, cost: 4, image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=900&q=80", prep: 3, tva: 10, stock: 92, badge: "populaire", allergens: [], calories: 4, featured: true, available: true, variants: ["Simple", "Double"], supplements: ["Lait", "Caramel"] },
  { id: 2, name: "Cafe creme", category: "coffee", price: 22, cost: 7, image: "https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=900&q=80", prep: 5, tva: 10, stock: 74, badge: "nouveau", allergens: ["Lait"], calories: 120, featured: true, available: true, variants: ["Petit", "Grand"], supplements: ["Chocolat", "Noisette"] },
  { id: 3, name: "The marocain", category: "tea", price: 18, cost: 5, image: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=900&q=80", prep: 7, tva: 10, stock: 60, badge: "signature", allergens: [], calories: 40, featured: true, available: true, variants: ["Verre", "Theiere"], supplements: ["Menthe extra"] },
  { id: 4, name: "Jus d'orange", category: "juice", price: 28, cost: 10, image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=900&q=80", prep: 4, tva: 10, stock: 35, badge: "frais", allergens: [], calories: 110, featured: false, available: true, variants: ["25cl", "50cl"], supplements: ["Gingembre"] },
  { id: 5, name: "Jus d'avocat", category: "juice", price: 34, cost: 13, image: "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?auto=format&fit=crop&w=900&q=80", prep: 5, tva: 10, stock: 22, badge: "premium", allergens: ["Lait"], calories: 260, featured: false, available: true, variants: ["Normal", "Fruits secs"], supplements: ["Miel"] },
  { id: 6, name: "Tacos poulet", category: "snack", price: 58, cost: 26, image: "https://images.unsplash.com/photo-1613514785940-daed07799d9b?auto=format&fit=crop&w=900&q=80", prep: 13, tva: 10, stock: 44, badge: "best-seller", allergens: ["Gluten", "Lait"], calories: 640, featured: true, available: true, variants: ["M", "L", "XL"], supplements: ["Fromage", "Sauce maison", "Viande"] },
  { id: 7, name: "Pizza margarita", category: "food", price: 72, cost: 30, image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=900&q=80", prep: 16, tva: 10, stock: 31, badge: "promo", allergens: ["Gluten", "Lait"], calories: 850, featured: false, available: true, variants: ["Petite", "Moyenne", "Grande"], supplements: ["Olives", "Mozzarella"] },
  { id: 8, name: "Burger maison", category: "snack", price: 64, cost: 29, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80", prep: 12, tva: 10, stock: 27, badge: "populaire", allergens: ["Gluten"], calories: 720, featured: false, available: true, variants: ["Classic", "Double"], supplements: ["Cheddar", "Oeuf"] },
  { id: 9, name: "Tajine poulet citron", category: "food", price: 88, cost: 38, image: "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&w=900&q=80", prep: 24, tva: 10, stock: 18, badge: "signature", allergens: [], calories: 690, featured: true, available: true, variants: ["Individuel", "A partager"], supplements: ["Pain maison"] },
  { id: 10, name: "Couscous royal", category: "food", price: 110, cost: 48, image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80", prep: 28, tva: 10, stock: 14, badge: "vendredi", allergens: ["Gluten"], calories: 920, featured: true, available: true, variants: ["Normal", "Royal"], supplements: ["Tfaya", "Bouillon"] },
  { id: 11, name: "Salade fraicheur", category: "food", price: 46, cost: 18, image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=80", prep: 8, tva: 10, stock: 40, badge: "healthy", allergens: [], calories: 260, featured: false, available: true, variants: ["Sans poulet", "Avec poulet"], supplements: ["Avocat"] },
  { id: 12, name: "Crepe chocolat", category: "dessert", price: 36, cost: 12, image: "https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=900&q=80", prep: 9, tva: 10, stock: 33, badge: "gourmand", allergens: ["Gluten", "Lait"], calories: 430, featured: false, available: true, variants: ["Chocolat", "Nutella"], supplements: ["Banane", "Amandes"] }
];

export const tables = [
  { id: 1, number: "T01", zone: "Interieur", capacity: 2, status: "FREE", x: 14, y: 18, shape: "round", qr: "https://maison-cafe.ma/menu?table=T01" },
  { id: 2, number: "T02", zone: "Interieur", capacity: 4, status: "OCCUPIED", x: 38, y: 22, shape: "square", qr: "https://maison-cafe.ma/menu?table=T02" },
  { id: 3, number: "T03", zone: "Terrasse", capacity: 4, status: "RESERVED", x: 68, y: 20, shape: "round", qr: "https://maison-cafe.ma/menu?table=T03" },
  { id: 4, number: "VIP 1", zone: "VIP", capacity: 8, status: "CLEANING", x: 22, y: 62, shape: "rectangle", qr: "https://maison-cafe.ma/menu?table=VIP1" },
  { id: 5, number: "T05", zone: "Terrasse", capacity: 6, status: "OCCUPIED", x: 62, y: 66, shape: "rectangle", qr: "https://maison-cafe.ma/menu?table=T05" }
];

export const customers = [
  { id: 1, name: "Amina Benali", phone: "+212 622 222 222", email: "amina@mail.com", level: "VIP", points: 1280, tags: ["brunch", "sans gluten"], visits: 42, total: 18600, birthday: "1992-08-14" },
  { id: 2, name: "Karim Idrissi", phone: "+212 633 333 333", email: "karim@mail.com", level: "Fidele", points: 620, tags: ["cafe", "terrasse"], visits: 21, total: 7400, birthday: "1988-03-02" },
  { id: 3, name: "Sarah El Fassi", phone: "+212 644 444 444", email: "sarah@mail.com", level: "Standard", points: 145, tags: ["livraison"], visits: 7, total: 1900, birthday: "1997-11-20" }
];

export const employees = [
  { id: 1, name: "Sara El Mansouri", role: "Serveur", status: "Actif", shift: "14:00 - 22:00", sales: 6200, orders: 46, permissions: ["orders", "tables", "customers"] },
  { id: 2, name: "Youssef Amrani", role: "Cuisine", status: "Actif", shift: "10:00 - 18:00", sales: 0, orders: 68, permissions: ["kitchen"] },
  { id: 3, name: "Mina Berrada", role: "Caissier", status: "Actif", shift: "16:00 - 00:00", sales: 11800, orders: 73, permissions: ["payments", "invoices"] },
  { id: 4, name: "Omar Tazi", role: "Manager", status: "Actif", shift: "09:00 - 17:00", sales: 15300, orders: 91, permissions: ["reports", "employees", "stock"] }
];

export const orders = [
  { id: 1024, code: "ORD-1024", table: "T02", customer: "Amina Benali", type: "TABLE", server: "Sara", status: "PREPARING", total: 342, createdAt: "10:18", items: ["2x Tacos poulet", "1x Cafe creme", "1x Crepe chocolat"], note: "Sans oignon", station: "cuisine" },
  { id: 1025, code: "ORD-1025", table: "Comptoir", customer: "Karim Idrissi", type: "COUNTER", server: "Mina", status: "READY", total: 86, createdAt: "10:25", items: ["2x Cafe noir", "1x Jus orange"], note: "A emporter", station: "bar" },
  { id: 1026, code: "ORD-1026", table: "Livraison", customer: "Sarah El Fassi", type: "DELIVERY", server: "Online", status: "CONFIRMED", total: 164, createdAt: "10:31", items: ["1x Pizza margarita", "1x Salade fraicheur"], note: "Appeler a l'arrivee", station: "cuisine" },
  { id: 1027, code: "ORD-1027", table: "VIP 1", customer: "Groupe Atlas", type: "TABLE", server: "Omar", status: "SERVED", total: 720, createdAt: "09:52", items: ["4x Couscous royal", "1x The marocain"], note: "Service VIP", station: "cuisine" },
  { id: 1028, code: "ORD-1028", table: "T05", customer: "Walk-in", type: "TABLE", server: "Sara", status: "NEW", total: 156, createdAt: "10:39", items: ["2x Burger maison", "1x Jus avocat"], note: "", station: "cuisine" }
];

export const reservations = [
  { id: 1, title: "Amina Benali - 5 pers.", customer: "Amina Benali", table: "T03", status: "CONFIRMED", start: "2026-05-04T19:30:00", end: "2026-05-04T21:30:00", phone: "+212 622 222 222" },
  { id: 2, title: "Karim Idrissi - 2 pers.", customer: "Karim Idrissi", table: "T01", status: "PENDING", start: "2026-05-04T20:00:00", end: "2026-05-04T21:30:00", phone: "+212 633 333 333" },
  { id: 3, title: "Equipe Design - 8 pers.", customer: "Equipe Design", table: "VIP 1", status: "ARRIVED", start: "2026-05-05T13:00:00", end: "2026-05-05T15:00:00", phone: "+212 655 555 555" }
];

export const stocks = [
  { id: 1, name: "Cafe arabica", supplier: "Atlas Beans", qty: 8, unit: "kg", threshold: 5, cost: 145, status: "NORMAL", trend: [12, 11, 10, 9, 8] },
  { id: 2, name: "Mozzarella", supplier: "Casa Fresh", qty: 2, unit: "kg", threshold: 4, cost: 72, status: "LOW", trend: [7, 6, 5, 3, 2] },
  { id: 3, name: "Avocat", supplier: "Primeur Anfa", qty: 0, unit: "caisse", threshold: 2, cost: 180, status: "OUT", trend: [5, 3, 2, 1, 0] },
  { id: 4, name: "Farine", supplier: "Moulin Maroc", qty: 18, unit: "kg", threshold: 8, cost: 9, status: "NORMAL", trend: [22, 20, 21, 19, 18] }
];

export const salesSeries = [
  { date: "Lun", revenue: 4200, orders: 38, delivery: 900, table: 2600, counter: 700 },
  { date: "Mar", revenue: 6100, orders: 52, delivery: 1400, table: 3600, counter: 1100 },
  { date: "Mer", revenue: 5400, orders: 49, delivery: 1000, table: 3400, counter: 1000 },
  { date: "Jeu", revenue: 7800, orders: 63, delivery: 1900, table: 4300, counter: 1600 },
  { date: "Ven", revenue: 9200, orders: 74, delivery: 2200, table: 5200, counter: 1800 },
  { date: "Sam", revenue: 12400, orders: 102, delivery: 3100, table: 7200, counter: 2100 },
  { date: "Dim", revenue: 9800, orders: 81, delivery: 2600, table: 5300, counter: 1900 }
];

export const paymentMethods = [
  { name: "Especes", value: 46 },
  { name: "Carte", value: 38 },
  { name: "Mixte", value: 11 },
  { name: "Credit", value: 5 }
];

export const activityHeatmap = [
  ["08h", 12], ["09h", 18], ["10h", 26], ["11h", 42], ["12h", 82], ["13h", 96], ["14h", 62], ["15h", 35], ["16h", 31], ["17h", 54], ["18h", 77], ["19h", 91], ["20h", 88], ["21h", 64]
];

export const auditLogs = [
  { id: 1, actor: "Omar Tazi", action: "A modifie le prix de Pizza margarita", time: "Il y a 8 min" },
  { id: 2, actor: "Mina Berrada", action: "A encaisse ORD-1025", time: "Il y a 15 min" },
  { id: 3, actor: "Sara El Mansouri", action: "A transfere T02 vers T05", time: "Il y a 28 min" }
];
