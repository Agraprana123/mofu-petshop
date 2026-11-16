import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

const CSV_DATA = `
,1,ALBENWORM SIRUP,,,,1,1,,36000,36000
,2,BAJU KUCING ,,,,1,1,,25000,25000
,3,BAK TAHU UKURAN L,,,,1,1,,20000,20000
,4,BAK TAHU UKURAN M,,,,1,1,,15000,15000
,5,BAK TAHU UKURAN S,,,,1,1,,10000,10000
,6,BATUXIN,,,,1,1,,25000,25000
,7,BEAUTY CAT 1 KG,,,,20,1,,600000,30000
,8,BEAUTY CAT GOLD 750 GR,,,,20,1,,660000,33000
,9,BOLA BEL KARET,,,,1,1,,17000,17000
,10,BOLA BEL PLASTIK,,,,1,1,,10000,10000
,11,BOLA BEL PLASTIK HOLLOW,,,,1,1,,7000,7000
,12,BOLA SPIRAL ISI TIKUS,,,,1,1,,15000,15000
,13,BOLT CAT DONAT 800 GR,,,,25,1,,500000,20000
,14,BOLT CAT IKAN 800 GR,,,,25,1,,500000,20000
,15,BOLT CAT SALMON 800 GR,,,,25,1,,500000,20000
,16,BOLT KITTEN 500 GR,,,,40,1,,560000,14000
,17,BOTOL DOT HEWAN,,,,1,1,,10000,10000
,18,BOTOL MINUM HAMSTER ,,,,1,1,,10000,10000
,19,CAT CHOICE TUNA ADULT KALENG 400 GR,,,,24,1,,360000,15000
,20,CAT CHOICE TUNA KITTEN KALENG 400 GR,,,,24,1,,360000,15000
,21,CAT CHOICE SALMON ADULT 800 GR,,,,25,1,,500000,20000
,22,CAT CHOICE SALMON KITTEN 1 KG,,,,20,1,,520000,26000
,23,CAT CHOICE TUNA ADULT 800 GR,,,,25,1,,500000,20000
,24,CAT CHOICE TUNA KITTEN 1 KG,,,,20,1,,520000,26000
,25,CAT LITTER DEODORIZING 250 ML,,,,1,1,,42000,42000
,26,CATYZOLE CACING 100 ML,,,,1,1,,37000,37000
,27,CHESTER 800 GR,,,,25,1,,475000,19000
,28,COLAR HEWAN BESAR,,,,1,1,,25000,25000
,29,COLAR HEWAN KECIL,,,,1,1,,15000,15000
,30,COLLOSTRUM,,,,10,1,,80000,8000
,31,DETICK 1 ML,,,,1,1,,35000,35000
,32,DOG CHOICE BEEF ADULT,,,,25,1,,600000,24000
,33,DRONTAL CAT,,,,1,1,,28000,28000
,34,EXCEL BABYMOM 500 GR,,,,40,1,,560000,14000
,35,EXCEL CAT DONAT 500 GR,,,,40,1,,520000,13000
,36,EXCEL CAT IKAN 500 GR,,,,40,1,,520000,13000
,37,EXCEL CAT SALMON 500 GR,,,,40,1,,520000,13000
,38,EXCEL CAT SEGITIGA 500 GR,,,,40,1,,520000,13000
,39,FELIBET DONAT 500 GR,,,,40,1,,560000,14000
,40,FELIBET MOTHER AND KITTEN 500 GR,,,,40,1,,600000,15000
,41,FELIBET SALMON 500 GR,,,,40,1,,560000,14000
,42,FELIBET TUNA 500 GR,,,,40,1,,560000,14000
,43,FELIBET TUNA OTORO 500 GR,,,,40,1,,560000,14000
,44,FISHING ROD TIKUS,,,,1,1,,15000,15000
,45,FOCAT SUPLEMEN TINGGI PROTEIN,,,,1,1,,68000,68000
,46,FOCAT MATA 10ML,,,,1,1,,30000,30000
,47,FOCAT SISIR GROOMING,,,,1,1,,25000,25000
,48,FURLOVE TUNA ADULT 1 KG,,,,20,1,,500000,25000
,49,FURLOVE TUNA KITTEN 1 KG,,,,20,1,,500000,25000
,50,GROWSSY,,,,12,1,,60000,5000
,51,GUNTING KUKU HEWAN,,,,1,1,,15000,15000
,52,HAM MEAL(MAKANAN HAMSTER),,,,1,1,,47000,47000
,53,HARNESS KUCING WARNA WARNI,,,,1,1,,15000,15000
,54,HEALTHY PET ALL STAGES,,,,1,1,,126000,126000
,55,HOLYCAT URNIE CARE,,,,1,1,,35000,35000
,56,IMMUNE BOOSTER 20 ML,,,,1,1,,48000,48000
,57,KALUNG KUCING BAHAN KULIT SINTETIS,,,,1,1,,15000,15000
,58,KALUNG KUCING MOTIF KARAKTER,,,,1,1,,10000,10000
,59,KALUNG KUCING MODEL JEPANG ANTI KUTU,,,,1,1,,30000,30000
,60,KITCHEN FLAVOR ADULT 1.5 KG,,,,1,1,,133000,133000
,61,LASER MAINAN,,,,1,1,,10000,10000
,62,LEZATO SALMON ADULT 1 KG,,,,20,1,,480000,24000
,63,LEZATO TUNA ADULT 1 KG,,,,20,1,,480000,24000
,64,LIFECAT CURAH 1 KG,,,,20,1,,600000,30000
,65,LIFECAT SACHET 85 GR,,,,24,1,,144000,6000
,66,LIFECAT CHICKEN AND SALMON 400 GR,,,,24,1,,336000,14000
,67,LIFECAT SALMON KITTEN 400 GR,,,,24,1,,336000,14000
,68,LIFECAT TOFU 7L,,,,1,1,,71000,71000
,69,LIFECAT TUNA ADULT 400 GR,,,,24,1,,336000,14000
,70,LIFECAT TUNA KITTEN 400 GR,,,,24,1,,336000,14000
,71,MAINAN TIKUS,,,,1,1,,8000,8000
,72,MARKOTOP CHICKEN AND SALMON KITTEN ,,,,25,1,,600000,24000
,73,MARKOTOP SALMON AND TUNA KITTEN,,,,25,1,,600000,24000
,74,MARKOTOP TUNA AND SALMON,,,,25,1,,575000,23000
,75,MAXI 1 KG,,,,20,1,,620000,31000
,76,MAXI 500 GR,,,,1,1,,16000,16000
,77,MEO CREAMY TREATS CHICKEN LIVER,,,,12,1,,300000,25000
,78,MEO CREAMY TREATS SALMON,,,,12,1,,300000,25000
,79,MEO CREAMY TREATS TUNA SCALLOP,,,,12,1,,300000,25000
,80,MEO KITTEN 1.1 KG,,,,1,1,,75000,75000
,81,MEO MACKEREL ADULT SACHET,,,,12,1,,108000,9000
,82,MEO PERSIAN ADULT,,,,1,1,,76000,76000
,83,MEO PERSIAN KITTEN,,,,1,1,,77000,77000
,84,MEO SALMON 1.1 KG,,,,1,1,,63000,63000
,85,MEO TUNA ADULT SACHET,,,,12,1,,108000,9000
,86,MEO TUNA KITTEN SACHET,,,,12,1,,108000,9000
,87,MEO TUNA 1.2 KG,,,,1,1,,63000,63000
,88,MEO TUNA ADULT 400 GR,,,,24,1,,480000,20000
,89,MEO TUNA KITTEN 400 GR,,,,24,1,,480000,20000
,90,MR PUSS SALMON 500 GR,,,,40,1,,500000,12500
,91,MR PUSS TUNA 500 GR,,,,40,1,,500000,12500
,92,MR VET CREAMY PREBIOTIC 60 GR,,,,1,1,,17000,17000
,93,MR VET CREAMY TAURINE 60 GR,,,,1,1,,17000,17000
,94,MR VET LYSINE 400 GR,,,,24,1,,528000,22000
,95,MR VET OMEGA 400 GR,,,,24,1,,528000,22000
,96,MR VET HAIR AND SKIN T2 1 KG,,,,1,1,,95000,95000
,97,MR VET URINARY CARE T3 1 KG,,,,1,1,,105000,105000
,98,MR VET INDOOR CARE T4 1 KG,,,,1,1,,105000,105000
,99,NATIVE GOLD,,,,1,1,,38000,38000
,100,ORICAT TUNA KITTEN 1 KG,,,,25,1,,600000,24000
,101,ORICAT PURE TUNA 400 GR,,,,24,1,,360000,15000
,102,ORICAT TUNA ADULT ,,,,25,1,,500000,20000
,103,PAKET BOTOL DOT,,,,1,1,,30000,30000
,104,PARFUM BIOPET,,,,1,1,,25000,25000
,105,PARFUM BULBUL,,,,1,1,,25000,25000
,106,PET CAGE DRY 50 CM STANDAR,,,,1,1,,145000,145000
,107,PET CAGE KA-02 61X42,,,,1,1,,190000,190000
,108,PET CARGO 2010,,,,1,1,,155000,155000
,109,PET CARGO KN-1000,,,,1,1,,115000,115000
,110,PET CARRIER MOTIF BATIK,,,,1,1,,185000,185000
,111,PET CARRIER TRANSPARAN,,,,1,1,,150000,150000
,112,REFILL ROLLER PEMBERSIH,,,,1,1,,10000,10000
,113,REMOV ANTI BAU 250 ML,,,,1,1,,50000,50000
,114,REMOV ANTIBIOTIK ,,,,1,1,,28000,28000
,115,REMOV BATUK,,,,1,1,,28000,28000
,116,REMOV DEMAM,,,,1,1,,28000,28000
,117,REMOV PENURUN BIRAHI,,,,1,1,,28000,28000
,118,ROLLER PEMBERSIH,,,,1,1,,15000,15000
,119,ROYAL CANIN HAIR AND SKIN,,,,1,1,,85000,85000
,120,ROYAL CANIN PERSIAN ADULT,,,,1,1,,83000,83000
,121,ROYAL CANIN URINARY CARE,,,,1,1,,83000,83000
,122,ROYAL CARE DIARE,,,,1,1,,23000,23000
,123,ROYAL CARE SARIAWAN,,,,1,1,,23000,23000
,124,ROYAL CARE TELINGA 10 ML,,,,1,1,,23000,23000
,125,RUBY 5 LITTER,,,,6,1,,180000,30000
,126,SCABIES CREAM,,,,1,1,,35000,35000
,127,SCADIX CAT,,,,1,1,,30000,30000
,128,SEROKAN HEWAN BENTUK KOTAK,,,,1,1,,10000,10000
,129,SEROKAN HEWAN GANTUNG,,,,1,1,,10000,10000
,130,SEROKAN HEWAN JUMBO,,,,1,1,,15000,15000
,131,SEROKAN HEWAN PANJANG,,,,1,1,,15000,15000
,132,SHAMPO FELIS 100 ML,,,,1,1,,15000,15000
,133,SHAMPO KEEVA 100 ML,,,,1,1,,15000,15000
,134,SISIR KUCING PERSEGI PANJANG,,,,1,1,,15000,15000
,135,SISIR KUTU,,,,1,1,,10000,10000
,136,SMART HEART RABBIT RASPBERRY,,,,1,1,,43000,43000
,137,SMART HEART RABBIT VEGGIS&CEREAL,,,,1,1,,43000,43000
,138,SPRAY TWO CLEAN,,,,1,1,,35000,35000
,139,TALI ROMPI HEWAN,,,,1,1,,30000,30000
,140,TARO 25 L,,,,1,1,,97000,97000
,141,TARO 10 L,,,,3,1,,141000,47000
,142,TARO 5 L,,,,6,1,,162000,27000
,143,TARO LITTER REPACK 1 KG,,,,1,1,,6000,6000
,144,TARO TOFU 7 L,,,,6,1,,330000,55000
,145,TAS KUCING JINJING MODEL ASTRONOT,,,,1,1,,110000,110000
,146,TAS KUCING JINJING  ,,,,1,1,,135000,135000
,147,TEMPAT MAKAN DAN MINUM DISPENSER,,,,1,1,,20000,20000
,148,TEMPAT MAKAN DOBEL DISPENSER,,,,1,1,,15000,15000
,149,TEMPAT MAKAN HEWAN BULAT ANTI SEMUT,,,,1,1,,10000,10000
,150,TEMPAT MAKAN HEWAN DOBEL ANTI SEMUT,,,,1,1,,10000,10000
,151,TEMPAT MAKAN HEWAN DOBEL STAINLESS STEEL UK 18 CM,,,,1,1,,80000,80000
,152,TEMPAT MAKAN HEWAN DOBEL STAINLESS STEEL UK 21 CM,,,,1,1,,90000,90000
,153,TEMPAT MAKAN HEWAN MODEL TULANG,,,,1,1,,10000,10000
,154,TEMPAT MAKAN HEWAN MOTIF ANGKA DELAPAN,,,,1,1,,15000,15000
,155,TEMPAT MAKAN HEWAN MOTIF OVAL ANTI SEMUT,,,,1,1,,15000,15000
,156,TEMPAT MAKAN HEWAN MOTIF TULANG ANTI SEMUT,,,,1,1,,15000,15000
,157,TEMPAT MAKAN HEWAN SINGLE MOTIF KEPALA,,,,1,1,,10000,10000
,158,TEMPAT MAKAN HEWAN STAINLESS STEEL SINGLE UK 15 CM,,,,1,1,,25000,25000
,159,TEMPAT MAKAN HEWAN STAINLESS STEEL SINGLE UK 18 CM,,,,1,1,,30000,30000
,160,TEMPAT MAKAN MINIMALIS,,,,1,1,,10000,10000
,161,TOP CAT 10 L,,,,3,1,,159000,53000
,162,TOP CAT 25 L,,,,1,1,,114000,114000
,163,TOP CAT 5 L,,,,6,1,,204000,34000
,164,TOP GROWTH,,,,12,1,,60000,5000
,165,TOP LITTER 1 KG,,,,1,1,,8000,8000
,166,TREATS LIEBAO,,,,1,1,,3000,3000
,167,TRIXIN TETES MATA,,,,1,1,,25000,25000
,168,TUTUP KALENG,,,,1,1,,10000,10000
,169,VISCCO OIL MERAH,,,,1,1,,35000,35000
,170,VIT VET PARFUM,,,,1,1,,25000,25000
,171,VITA PLUS,,,,1,1,,28000,28000
,172,VITA RABBIT 1 KG,,,,1,1,,14000,14000
,173,WHISKAS JUNIOR OCEAN FISH 1.1 KG,,,,1,1,,71000,71000
,174,WHISKAS MACKEREL ADULT 85 GR,,,,28,1,,224000,8000
,175,WHISKAS MACKEREL JUNIOR 80 GR,,,,28,1,,224000,8000
,176,WHISKAS TUNA 400 GR,,,,24,1,,600000,25000
,177,WHISKAS TUNA ADULT 1.2 KG,,,,1,1,,67000,67000
,178,WHISKAS TUNA ADULT 85 GR,,,,24,1,,192000,8000
,179,WHISKAS TUNA JUNIOT 80 GR,,,,24,1,,192000,8000
,180,WOODEN FEATHER,,,,1,1,,20000,20000
,,ROYAL CARE DEMAM',,,,1,1,,23000,23000
`;

function categorize(name: string): string {
  const n = name.toUpperCase();
  if (
    n.includes("COLLOSTRUM") ||
    n.includes("GROWSSY") ||
    n.includes("TOP GROWTH") ||
    n.includes("GOAT MILK") ||
    n.includes("GROWYS")
  ) {
    return "DRINK";
  }
  if (
    n.includes("LITTER") ||
    n.includes("TOFU") ||
    n.includes("TARO 25 L") ||
    n.includes("TARO 10 L") ||
    n.includes("TARO 5 L") ||
    n.includes("TOP CAT 10 L") ||
    n.includes("TOP CAT 25 L") ||
    n.includes("TOP CAT 5 L") ||
    n.includes("RUBY 5 LITTER")
  ) {
    return "LITTER";
  }
  if (
    n.includes("SIRUP") ||
    n.includes("BATUXIN") ||
    n.includes("CACING") ||
    n.includes("DETICK") ||
    n.includes("DRONTAL") ||
    n.includes("SUPLEMEN") ||
    n.includes("MATA") ||
    n.includes("URINE") ||
    n.includes("URNIE") ||
    n.includes("IMMUNE") ||
    n.includes("ANTI BAU") ||
    n.includes("ANTIBIOTIK") ||
    n.includes("BATUK") ||
    n.includes("DEMAM") ||
    n.includes("BIRAHI") ||
    n.includes("ROYAL CARE") ||
    n.includes("SCABIES") ||
    n.includes("SCADIX") ||
    n.includes("SHAMPO") ||
    n.includes("SPRAY TWO") ||
    n.includes("TRIXIN") ||
    n.includes("VISCCO") ||
    n.includes("VITA PLUS") ||
    n.includes("PARFUM")
  ) {
    return "OBAT&KOSMETIK";
  }
  if (
    n.includes("BAJU") ||
    n.includes("BAK TAHU") ||
    n.includes("BOLA") ||
    n.includes("BOTOL") ||
    n.includes("COLAR") ||
    n.includes("FISHING ROD") ||
    n.includes("SISIR") ||
    n.includes("GUNTING") ||
    n.includes("HARNESS") ||
    n.includes("KALUNG") ||
    n.includes("LASER") ||
    n.includes("TIKUS") ||
    n.includes("CAGE") ||
    n.includes("CARGO") ||
    n.includes("CARRIER") ||
    n.includes("ROLLER") ||
    n.includes("SEROKAN") ||
    n.includes("TALI ROMPI") ||
    n.includes("TAS KUCING") ||
    n.includes("TEMPAT MAKAN") ||
    n.includes("TUTUP KALENG") ||
    n.includes("WOODEN FEATHER")
  ) {
    return "AKSESORIS";
  }
  if (
    n.includes("KALENG") ||
    n.includes("SACHET") ||
    n.includes("400 GR") ||
    n.includes("CREAMY") ||
    n.includes("TREATS") ||
    n.includes("85 GR") ||
    n.includes("80 GR") ||
    n.includes("PREBIOTIC 60 GR") ||
    n.includes("TAURINE 60 GR")
  ) {
    return "WET";
  }
  return "DRY";
}

function getBaseUnitCode(name: string, category: string): string {
  const n = name.toUpperCase();
  if (n.includes("KALENG") || (category === "WET" && n.includes("400 GR"))) {
    return "KLG";
  }
  if (
    n.includes("SACHET") ||
    (category === "WET" && (n.includes("85 GR") || n.includes("80 GR")))
  ) {
    return "SACHET";
  }
  if (category === "DRY" && (n.includes("KG") || n.includes("GR"))) {
    return "BKS";
  }
  return "PCS";
}

async function main() {
  console.log("🚀 Memulai import data barang riil MOFU Petshop...");

  // 1. Setup Kategori
  const categoryNames = [
    "OBAT&KOSMETIK",
    "AKSESORIS",
    "DRY",
    "WET",
    "LITTER",
    "DRINK",
  ];
  const categoryMap = new Map<string, number>();
  for (const name of categoryNames) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name, defaultMarginPercent: new Decimal(10) },
    });
    categoryMap.set(name, cat.id);
  }

  // 2. Setup Satuan
  const unitList = [
    { code: "PCS", name: "Pieces / Satuan" },
    { code: "KLG", name: "Kaleng" },
    { code: "SACHET", name: "Sachet" },
    { code: "BKS", name: "Bungkus" },
    { code: "BTL", name: "Botol" },
    { code: "DUS", name: "Dus / Karton" },
    { code: "SAK", name: "Sak / Karung" },
    { code: "PACK", name: "Pack" },
    { code: "KG", name: "Kilogram" },
    { code: "GR", name: "Gram" },
  ];
  const unitMap = new Map<string, number>();
  for (const u of unitList) {
    const unit = await prisma.unit.upsert({
      where: { code: u.code },
      update: { name: u.name },
      create: u,
    });
    unitMap.set(u.code, unit.id);
  }

  const dusUnitId = unitMap.get("DUS")!;

  // 3. Parse CSV rows
  const lines = CSV_DATA.trim().split("\n");
  console.log(`📋 Memproses ${lines.length} baris data produk...`);

  let importedCount = 0;
  let batchCount = 0;
  let multiUnitCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(",");
    const rowNum = i + 1;
    const rawName = parts[2]
      ? parts[2].trim().replace(/^'+|'+$/g, "")
      : "";
    if (!rawName) continue;

    const satBesar = Number(parts[6]) || 1;
    const sellPrice = Number(parts[10]) || Number(parts[9]) || 0;
    // Estimasi harga beli dasar (modal) dengan asumsi margin 10%
    const buyPrice = sellPrice > 0 ? Math.round(sellPrice / 1.1) : 0;

    const category = categorize(rawName);
    const catId = categoryMap.get(category)!;
    const baseUnitCode = getBaseUnitCode(rawName, category);
    const baseUnitId = unitMap.get(baseUnitCode) || unitMap.get("PCS")!;

    const code = `PRD-${String(rowNum).padStart(4, "0")}`;

    // Upsert produk
    const product = await prisma.product.upsert({
      where: { code },
      update: {
        name: rawName,
        categoryId: catId,
        baseUnitId,
        sellPrice: new Decimal(sellPrice),
        buyPrice: new Decimal(buyPrice),
        marginPercent: new Decimal(10),
        minStock: new Decimal(5),
        isActive: true,
      },
      create: {
        code,
        name: rawName,
        categoryId: catId,
        baseUnitId,
        sellPrice: new Decimal(sellPrice),
        buyPrice: new Decimal(buyPrice),
        marginPercent: new Decimal(10),
        minStock: new Decimal(5),
        isActive: true,
      },
    });

    importedCount++;

    // Jika satuan besar > 1 (e.g. 1 DUS = 20/24/25 PCS), buat konversi ProductUnit
    if (satBesar > 1) {
      await prisma.productUnit.upsert({
        where: {
          productId_unitId: {
            productId: product.id,
            unitId: dusUnitId,
          },
        },
        update: {
          conversionToBase: new Decimal(satBesar),
        },
        create: {
          productId: product.id,
          unitId: dusUnitId,
          conversionToBase: new Decimal(satBesar),
        },
      });
      multiUnitCount++;
    }

    // Inisialisasi Batch FIFO awal agar kasir langsung memiliki stok & harga batch
    const existingBatch = await prisma.stockBatch.findFirst({
      where: { productId: product.id },
    });

    const initialStock = 10; // Stok awal 10 satuan dasar per item
    if (!existingBatch) {
      const batch = await prisma.stockBatch.create({
        data: {
          productId: product.id,
          qtyIn: new Decimal(initialStock),
          qtyRemaining: new Decimal(initialStock),
          costPerBase: new Decimal(buyPrice),
          marginPercent: new Decimal(10),
          sellPricePerBase: new Decimal(sellPrice),
          receivedAt: new Date(),
        },
      });

      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          batchId: batch.id,
          type: "ADJUSTMENT",
          qtyBase: new Decimal(initialStock),
          refType: "SaldoAwal",
          refId: batch.id,
        },
      });

      batchCount++;
    } else {
      // Perbarui harga snapshot batch yang sudah ada agar sinkron dengan harga master baru
      await prisma.stockBatch.update({
        where: { id: existingBatch.id },
        data: {
          sellPricePerBase: new Decimal(sellPrice),
          costPerBase: new Decimal(buyPrice),
          marginPercent: new Decimal(10),
        },
      });
    }
  }

  console.log("\n✅ IMPORT DATA BARANG BERHASIL!");
  console.log(`- Total Produk diimpor : ${importedCount}`);
  console.log(`- Multi-satuan (DUS)   : ${multiUnitCount}`);
  console.log(`- Batch FIFO baru      : ${batchCount}`);
}

main()
  .catch((e) => {
    console.error("❌ Error saat import data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
