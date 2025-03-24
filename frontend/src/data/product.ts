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

export const pesananList = [

            {
              no: 1,
              tanggal: "2025-03-01",
              noFaktur: "INV-001",
              total: 1500000,
              DP: 500000,
              pemasok: "Distributor A",
              operator: "Admin 1",
              status: true, // Lunas
            },
            {
              no: 2,
              tanggal: "2025-03-02",
              noFaktur: "INV-002",
              total: 2000000,
              DP: 800000,
              pemasok: "Distributor B",
              operator: "Admin 2",
              status: false, // Belum Lunas
            },
            {
              no: 3,
              tanggal: "2025-03-03",
              noFaktur: "INV-003",
              total: 1750000,
              DP: 750000,
              pemasok: "Distributor C",
              operator: "Admin 1",
              status: true,
            },
            {
              no: 4,
              tanggal: "2025-03-04",
              noFaktur: "INV-004",
              total: 2500000,
              DP: 1000000,
              pemasok: "Distributor D",
              operator: "Admin 3",
              status: false,
            },
            {
              no: 5,
              tanggal: "2025-03-05",
              noFaktur: "INV-005",
              total: 3000000,
              DP: 1500000,
              pemasok: "Distributor E",
              operator: "Admin 2",
              status: true,
            },
            {
              no: 6,
              tanggal: "2025-03-06",
              noFaktur: "INV-006",
              total: 2750000,
              DP: 1250000,
              pemasok: "Distributor A",
              operator: "Admin 3",
              status: false,
            },
            {
              no: 7,
              tanggal: "2025-03-07",
              noFaktur: "INV-007",
              total: 2250000,
              DP: 1000000,
              pemasok: "Distributor B",
              operator: "Admin 1",
              status: true,
            },
            {
              no: 8,
              tanggal: "2025-03-08",
              noFaktur: "INV-008",
              total: 4000000,
              DP: 2000000,
              pemasok: "Distributor C",
              operator: "Admin 2",
              status: false,
            },
            {
              no: 9,
              tanggal: "2025-03-09",
              noFaktur: "INV-009",
              total: 3500000,
              DP: 1750000,
              pemasok: "Distributor D",
              operator: "Admin 3",
              status: true,
            },
            {
              no: 10,
              tanggal: "2025-03-10",
              noFaktur: "INV-010",
              total: 1800000,
              DP: 800000,
              pemasok: "Distributor E",
              operator: "Admin 1",
              status: false,
            },
]

export const distributors = [
  {
    value: "1",
    label: "Distributor A",
  },
  {
    value: "2",
    label: "Distributor B",
  },
  {
    value: "3",
    label: "Distributor C",
  },
  {
    value: "4",
    label: "Distributor D",
  },
  {
    value: "5",
    label: "Distributor E",
  },

]
export const operators = [
  {
    id: "1",
    name: "Edwin",
    role: "admin"
  },
  {
    id: "2",
    name: "Juan",
    role: "admin"
  },
  {
    id: "3",
    name: "Rizky",
    role: "admin"
  },
  {
    id: "4",
    name: "Sugeng",
    role: "staff"
  },
  {
    id: "5",
    name: "Tresno",
    role: "staff"
  },
  
]

export const HutangData = [
  {
    id: 1,
    kodePemasok: "SUP123",
    namaPemasok: "Pemasok A",
    totalHutang: 1000000,
    detail: "Pembelian barang A",
    tanggal: "2025-03-01",
    noFaktur: "Faktur001",
    tipeBayar: "Tunai",
    kas: "Kas 1",
    jatuhTempo: "2025-03-15",
    notaRetur: "Retur001",
    jumlahHutang: 800000,
    diskon: 5,  // Diskon dalam persen
    totalHutangSetelahDiskon: 760000, // Total hutang setelah diskon
    pembayaran: 300000,
    sisaHutang: 460000, // Sisa hutang setelah pembayaran
  },
  {
    id: 2,
    kodePemasok: "SUP124",
    namaPemasok: "Pemasok B",
    totalHutang: 500000,
    detail: "Pembelian barang B",
    tanggal: "2025-02-15",
    noFaktur: "Faktur002",
    tipeBayar: "Kredit",
    kas: "Kas 2",
    jatuhTempo: "2025-03-01",
    notaRetur: "Retur002",
    jumlahHutang: 500000,
    diskon: 10, // Diskon dalam persen
    totalHutangSetelahDiskon: 450000, // Total hutang setelah diskon
    pembayaran: 150000,
    sisaHutang: 300000, // Sisa hutang setelah pembayaran
  },
  {
    id: 3,
    kodePemasok: "SUP125",
    namaPemasok: "Pemasok C",
    totalHutang: 2000000,
    detail: "Pembelian barang C",
    tanggal: "2025-03-05",
    noFaktur: "Faktur003",
    tipeBayar: "Tunai",
    kas: "Kas 1",
    jatuhTempo: "2025-03-20",
    notaRetur: "Retur003",
    jumlahHutang: 2000000,
    diskon: 0, // Diskon tidak ada
    totalHutangSetelahDiskon: 2000000, // Total hutang tetap
    pembayaran: 500000,
    sisaHutang: 1500000, // Sisa hutang setelah pembayaran
  }
];

export const poinMemberPelanggan = [
  {
    id: 1,
    kodePelanggan: "CUST001",
    namaPelanggan: "Ahmad Setiawan",
    alamat: "Jl. Melati No.12, Bandung",
    telepon: "081234567890",
    poin: 120,
    riwayatPoin: [
      {
        id: 1,
        tanggal: "2025-03-01",
        keterangan: "Pembelian senilai 500rb",
        penambahan: 50,
        pengurangan: 0,
        total: 50
      },
      {
        id: 2,
        tanggal: "2025-03-05",
        keterangan: "Penukaran voucher",
        penambahan: 0,
        pengurangan: 20,
        total: 30
      },
      {
        id: 3,
        tanggal: "2025-03-10",
        keterangan: "Promo Maret",
        penambahan: 40,
        pengurangan: 0,
        total: 70
      },
      {
        id: 4,
        tanggal: "2025-03-15",
        keterangan: "Pembelian ulang",
        penambahan: 50,
        pengurangan: 0,
        total: 120
      }
    ]
  },
  {
    id: 2,
    kodePelanggan: "CUST002",
    namaPelanggan: "Rina Marlina",
    alamat: "Jl. Merdeka No.88, Jakarta",
    telepon: "082112233445",
    poin: 90,
    riwayatPoin: [
      {
        id: 1,
        tanggal: "2025-03-03",
        keterangan: "Pembelian produk baru",
        penambahan: 40,
        pengurangan: 0,
        total: 40
      },
      {
        id: 2,
        tanggal: "2025-03-08",
        keterangan: "Promo cashback",
        penambahan: 30,
        pengurangan: 0,
        total: 70
      },
      {
        id: 3,
        tanggal: "2025-03-12",
        keterangan: "Penukaran merchandise",
        penambahan: 0,
        pengurangan: 20,
        total: 50
      },
      {
        id: 4,
        tanggal: "2025-03-18",
        keterangan: "Pembelian ulang",
        penambahan: 40,
        pengurangan: 0,
        total: 90
      }
    ]
  },
  {
    id: 3,
    kodePelanggan: "CUST003",
    namaPelanggan: "Budi Santoso",
    alamat: "Jl. Mawar No.5, Surabaya",
    telepon: "085643211789",
    poin: 150,
    riwayatPoin: [
      {
        id: 1,
        tanggal: "2025-03-01",
        keterangan: "Pembelian besar",
        penambahan: 100,
        pengurangan: 0,
        total: 100
      },
      {
        id: 2,
        tanggal: "2025-03-09",
        keterangan: "Promo spesial",
        penambahan: 50,
        pengurangan: 0,
        total: 150
      }
    ]
  },
  {
    id: 4,
    kodePelanggan: "CUST004",
    namaPelanggan: "Sari Dewi",
    alamat: "Jl. Kamboja No.3, Medan",
    telepon: "087712345678",
    poin: 70,
    riwayatPoin: [
      {
        id: 1,
        tanggal: "2025-03-02",
        keterangan: "Pembelian awal bulan",
        penambahan: 70,
        pengurangan: 0,
        total: 70
      }
    ]
  }
];

 export const laporanKas = [
  {
    tanggal: "2025-03-01",
    noFaktur: "FK001",
    keterangan: "Penjualan tunai",
    masuk: 1000000,
    keluar: 0,
    total: 1000000,
    tipe: "Masuk",
    operator: "admin",
    kasBank: "Kas Utama"
  },
  {
    tanggal: "2025-03-02",
    noFaktur: "FK002",
    keterangan: "Pembayaran piutang CUST001",
    masuk: 500000,
    keluar: 0,
    total: 500000,
    tipe: "Masuk",
    operator: "kasir 1",
    kasBank: "Bank BCA"
  },
  {
    tanggal: "2025-03-03",
    noFaktur: "FK003",
    keterangan: "Pembayaran sewa tempat",
    masuk: 0,
    keluar: 250000,
    total: 250000,
    tipe: "Keluar",
    operator: "admin",
    kasBank: "Bank Mandiri"
  },
  {
    tanggal: "2025-03-04",
    noFaktur: "FK004",
    keterangan: "Pembelian alat tulis",
    masuk: 0,
    keluar: 100000,
    total: 100000,
    tipe: "Keluar",
    operator: "kasir 2",
    kasBank: "Kas Utama"
  },
  {
    tanggal: "2025-03-05",
    noFaktur: "FK005",
    keterangan: "Penjualan via transfer BCA",
    masuk: 750000,
    keluar: 0,
    total: 750000,
    tipe: "Masuk",
    operator: "kasir 1",
    kasBank: "Bank BCA"
  },
  {
    tanggal: "2025-03-06",
    noFaktur: "FK006",
    keterangan: "Pembayaran gaji bulanan",
    masuk: 0,
    keluar: 3000000,
    total: 3000000,
    tipe: "Keluar",
    operator: "admin",
    kasBank: "Bank Mandiri"
  }
];
