// data/products.ts
export const products = [
    { id: 1, name: "Chocolate Powder", price: 25000, price2: 26000, purchasePrice: 20000, barcode: "1234567890123", quantityOutput: 100, boughtLast7Days: 50, soldLast7Days: 40, boughtLast30Days: 200, soldLast30Days: 180 },
    { id: 2, name: "Vanilla Powder", price: 24000, price2: 25000, purchasePrice: 19000, barcode: "9876543210987", quantityOutput: 120, boughtLast7Days: 60, soldLast7Days: 50, boughtLast30Days: 250, soldLast30Days: 220 },
    { id: 3, name: "Strawberry Powder", price: 26000, price2: 27000, purchasePrice: 21000, barcode: "4567890123456", quantityOutput: 90, boughtLast7Days: 45, soldLast7Days: 35, boughtLast30Days: 180, soldLast30Days: 160 },
    { id: 4, name: "Matcha Powder", price: 27000, price2: 28000, purchasePrice: 22000, barcode: "3216549870123", quantityOutput: 85, boughtLast7Days: 40, soldLast7Days: 30, boughtLast30Days: 170, soldLast30Days: 150 },
    { id: 5, name: "Coffee Powder", price: 28000, price2: 29000, purchasePrice: 23000, barcode: "6543210987654", quantityOutput: 75, boughtLast7Days: 35, soldLast7Days: 25, boughtLast30Days: 160, soldLast30Days: 140 },
    { id: 6, name: "Hazelnut Powder", price: 29000, price2: 30000, purchasePrice: 24000, barcode: "7890123456789", quantityOutput: 95, boughtLast7Days: 50, soldLast7Days: 45, boughtLast30Days: 200, soldLast30Days: 180 },
    { id: 7, name: "Caramel Powder", price: 30000, price2: 31000, purchasePrice: 25000, barcode: "1478523690123", quantityOutput: 80, boughtLast7Days: 30, soldLast7Days: 20, boughtLast30Days: 150, soldLast30Days: 130 },
    { id: 8, name: "Taro Powder", price: 26000, price2: 27000, purchasePrice: 21000, barcode: "3692581470123", quantityOutput: 110, boughtLast7Days: 55, soldLast7Days: 50, boughtLast30Days: 220, soldLast30Days: 200 },
    { id: 9, name: "Black Sesame Powder", price: 32000, price2: 33000, purchasePrice: 27000, barcode: "2583691470123", quantityOutput: 70, boughtLast7Days: 25, soldLast7Days: 15, boughtLast30Days: 140, soldLast30Days: 120 },
    { id: 10, name: "Coconut Powder", price: 27000, price2: 28000, purchasePrice: 22000, barcode: "1593572580123", quantityOutput: 100, boughtLast7Days: 45, soldLast7Days: 40, boughtLast30Days: 190, soldLast30Days: 170 },


    { id: 11, name: "Caramel Syrup", price: 32000, price2: 33000, purchasePrice: 28000, barcode: "1111111111111", quantityOutput: 50, boughtLast7Days: 20, soldLast7Days: 15, boughtLast30Days: 100, soldLast30Days: 90 },
    { id: 12, name: "Vanilla Syrup", price: 31000, price2: 32000, purchasePrice: 27000, barcode: "2222222222222", quantityOutput: 60, boughtLast7Days: 25, soldLast7Days: 18, boughtLast30Days: 110, soldLast30Days: 95 },
    { id: 13, name: "Hazelnut Syrup", price: 33000, price2: 34000, purchasePrice: 29000, barcode: "3333333333333", quantityOutput: 45, boughtLast7Days: 15, soldLast7Days: 10, boughtLast30Days: 90, soldLast30Days: 85 },
    { id: 14, name: "Chocolate Syrup", price: 34000, price2: 35000, purchasePrice: 30000, barcode: "4444444444444", quantityOutput: 55, boughtLast7Days: 22, soldLast7Days: 17, boughtLast30Days: 120, soldLast30Days: 100 },
    { id: 15, name: "Honey", price: 35000, price2: 36000, purchasePrice: 31000, barcode: "5555555555555", quantityOutput: 40, boughtLast7Days: 12, soldLast7Days: 8, boughtLast30Days: 80, soldLast30Days: 75 },
    { id: 16, name: "Condensed Milk", price: 30000, price2: 31000, purchasePrice: 26000, barcode: "6666666666666", quantityOutput: 90, boughtLast7Days: 35, soldLast7Days: 30, boughtLast30Days: 170, soldLast30Days: 160 },
    { id: 17, name: "Fresh Milk", price: 35000, price2: 36000, purchasePrice: 32000, barcode: "7777777777777", quantityOutput: 75, boughtLast7Days: 28, soldLast7Days: 25, boughtLast30Days: 150, soldLast30Days: 140 },
    { id: 18, name: "Matcha Tea", price: 28000, price2: 29000, purchasePrice: 24000, barcode: "8888888888888", quantityOutput: 100, boughtLast7Days: 50, soldLast7Days: 45, boughtLast30Days: 200, soldLast30Days: 190 },
    { id: 19, name: "Black Tea", price: 27000, price2: 28000, purchasePrice: 23000, barcode: "9999999999999", quantityOutput: 80, boughtLast7Days: 33, soldLast7Days: 30, boughtLast30Days: 160, soldLast30Days: 150 },
    { id: 20, name: "Green Tea", price: 29000, price2: 30000, purchasePrice: 25000, barcode: "1010101010101", quantityOutput: 85, boughtLast7Days: 40, soldLast7Days: 35, boughtLast30Days: 180, soldLast30Days: 170 },
    { id: 21, name: "Espresso Coffee", price: 40000, price2: 42000, purchasePrice: 37000, barcode: "1112131415161", quantityOutput: 60, boughtLast7Days: 25, soldLast7Days: 20, boughtLast30Days: 120, soldLast30Days: 110 },
    { id: 22, name: "Instant Coffee", price: 28000, price2: 29000, purchasePrice: 25000, barcode: "2122232425262", quantityOutput: 95, boughtLast7Days: 40, soldLast7Days: 35, boughtLast30Days: 180, soldLast30Days: 170 },

    { id: 23, name: "Minyak Goreng Bimoli 2L", price: 37000, price2: 38000, purchasePrice: 35000, barcode: "3333333333333", quantityOutput: 50, boughtLast7Days: 22, soldLast7Days: 20, boughtLast30Days: 110, soldLast30Days: 100 },
    { id: 24, name: "Beras Rojolele 5kg", price: 65000, price2: 67000, purchasePrice: 62000, barcode: "4444444444444", quantityOutput: 40, boughtLast7Days: 15, soldLast7Days: 12, boughtLast30Days: 90, soldLast30Days: 85 },
    { id: 25, name: "Gula Pasir Gulaku 1kg", price: 14000, price2: 15000, purchasePrice: 13000, barcode: "5555555555555", quantityOutput: 100, boughtLast7Days: 40, soldLast7Days: 35, boughtLast30Days: 190, soldLast30Days: 170 },
    { id: 26, name: "Indomie Goreng Original", price: 3000, price2: 3500, purchasePrice: 2500, barcode: "6666666666666", quantityOutput: 200, boughtLast7Days: 80, soldLast7Days: 75, boughtLast30Days: 300, soldLast30Days: 290 },
    { id: 27, name: "Teh Botol Sosro 350ml", price: 5000, price2: 5500, purchasePrice: 4000, barcode: "7777777777777", quantityOutput: 180, boughtLast7Days: 70, soldLast7Days: 65, boughtLast30Days: 250, soldLast30Days: 240 },
    { id: 28, name: "Kecap Manis ABC 600ml", price: 20000, price2: 21000, purchasePrice: 18000, barcode: "8888888888888", quantityOutput: 90, boughtLast7Days: 30, soldLast7Days: 25, boughtLast30Days: 150, soldLast30Days: 140 },
    { id: 29, name: "Susu UHT Ultra 1L", price: 17000, price2: 18000, purchasePrice: 15000, barcode: "9999999999999", quantityOutput: 130, boughtLast7Days: 50, soldLast7Days: 45, boughtLast30Days: 200, soldLast30Days: 180 },
    { id: 30, name: "Mie Sedaap Kari Ayam", price: 3000, price2: 3500, purchasePrice: 2600, barcode: "1010101010101", quantityOutput: 190, boughtLast7Days: 90, soldLast7Days: 85, boughtLast30Days: 320, soldLast30Days: 310 },
    { id: 31, name: "Air Mineral Aqua 600ml", price: 5000, price2: 5500, purchasePrice: 4000, barcode: "1112131415161", quantityOutput: 220, boughtLast7Days: 100, soldLast7Days: 95, boughtLast30Days: 350, soldLast30Days: 340 },
    { id: 32, name: "Tepung Terigu Segitiga Biru 1kg", price: 14000, price2: 15000, purchasePrice: 12000, barcode: "2122232425262", quantityOutput: 85, boughtLast7Days: 30, soldLast7Days: 28, boughtLast30Days: 160, soldLast30Days: 150 }
];

