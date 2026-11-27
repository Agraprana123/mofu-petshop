import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

const LATEST_CSV_DATA = `
,1,ALBENWORM SIRUP,,,,1
,2,BAJU KUCING ,,,,8
,3,BAK TAHU UKURAN L,,,,2
,4,BAK TAHU UKURAN M,,,,4
,5,BAK TAHU UKURAN S,,,,2
,6,BATUXIN,,,,3
,7,BEAUTY CAT 1 KG,,,,14
,8,BEAUTY CAT GOLD 750 GR,,,,4
,9,BOLA BEL KARET,,,,10
,10,BOLA BEL PLASTIK,,,,7
,11,BOLA BEL PLASTIK HOLLOW,,,,9
,12,BOLA SPIRAL ISI TIKUS,,,,4
,13,BOLT CAT DONAT 800 GR,,,,17
,14,BOLT CAT IKAN 800 GR,,,,28
,15,BOLT CAT SALMON 800 GR,,,,19
,16,BOLT KITTEN 500 GR,,,,28
,17,BOTOL DOT HEWAN,,,,2
,18,BOTOL MINUM HAMSTER ,,,,5
,19,CAT CHOICE TUNA ADULT KALENG 400 GR,,,,22
,20,CAT CHOICE TUNA KITTEN KALENG 400 GR,,,,14
,21,CAT CHOICE SALMON ADULT 800 GR,,,,13
,22,CAT CHOICE SALMON KITTEN 1 KG,,,,7
,23,CAT CHOICE TUNA ADULT 800 GR,,,,29
,24,CAT CHOICE TUNA KITTEN 1 KG,,,,18
,25,CAT LITTER DEODORIZING 250 ML,,,,1
,26,CATYZOLE CACING 100 ML,,,,5
,27,CHESTER 800 GR,,,,18
,28,COLAR HEWAN BESAR,,,,1
,29,COLAR HEWAN KECIL,,,,1
,30,COLLOSTRUM,,,,14
,31,DETICK 1 ML,,,,1
,32,DOG CHOICE BEEF ADULT,,,,24
,33,DRONTAL CAT,,,,4
,34,EXCEL BABYMOM 500 GR,,,,39
,35,EXCEL CAT DONAT 500 GR,,,,30
,36,EXCEL CAT IKAN 500 GR,,,,53
,37,EXCEL CAT SALMON 500 GR,,,,20
,38,EXCEL CAT SEGITIGA 500 GR,,,,25
,39,FELIBET DONAT 500 GR,,,,35
,40,FELIBET MOTHER AND KITTEN 500 GR,,,,16
,41,FELIBET SALMON 500 GR,,,,36
,42,FELIBET TUNA 500 GR,,,,13
,43,FELIBET TUNA OTORO 500 GR,,,,38
,44,FISHING ROD TIKUS,,,,5
,45,FOCAT SUPLEMEN TINGGI PROTEIN,,,,1
,46,FOCAT MATA 10ML,,,,0
,47,FOCAT SISIR GROOMING,,,,1
,48,FURLOVE TUNA ADULT 1 KG,,,,8
,49,FURLOVE TUNA KITTEN 1 KG,,,,16
,50,GROWSSY,,,,14
,51,GUNTING KUKU HEWAN,,,,2
,52,HAM MEAL(MAKANAN HAMSTER),,,,1
,53,HARNESS KUCING WARNA WARNI,,,,11
,54,HEALTHY PET ALL STAGES,,,,1
,55,HOLYCAT URNIE CARE,,,,1
,56,IMMUNE BOOSTER 20 ML,,,,1
,57,KALUNG KUCING BAHAN KULIT SINTETIS,,,,15
,58,KALUNG KUCING MOTIF KARAKTER,,,,28
,59,KALUNG KUCING MODEL JEPANG ANTI KUTU,,,,2
,60,KITCHEN FLAVOR ADULT 1.5 KG,,,,5
,61,LASER MAINAN,,,,3
,62,LEZATO SALMON ADULT 1 KG,,,,16
,63,LEZATO TUNA ADULT 1 KG,,,,13
,64,LIFECAT CURAH 1 KG,,,,1
,65,LIFECAT SACHET 85 GR,,,,91
,66,LIFECAT CHICKEN AND SALMON 400 GR,,,,7
,67,LIFECAT SALMON KITTEN 400 GR,,,,17
,68,LIFECAT TOFU 7L,,,,5
,69,LIFECAT TUNA ADULT 400 GR,,,,18
,70,LIFECAT TUNA KITTEN 400 GR,,,,23
,71,MAINAN TIKUS,,,,3
,72,MARKOTOP CHICKEN AND SALMON KITTEN ,,,,27
,73,MARKOTOP SALMON AND TUNA KITTEN,,,,23
,74,MARKOTOP TUNA AND SALMON,,,,23
,75,MAXI 1 KG,,,,7
,76,MAXI 500 GR,,,,5
,77,MEO CREAMY TREATS CHICKEN LIVER,,,,10
,78,MEO CREAMY TREATS SALMON,,,,8
,79,MEO CREAMY TREATS TUNA SCALLOP,,,,7
,80,MEO KITTEN 1.1 KG,,,,1
,81,MEO MACKEREL ADULT SACHET,,,,12
,82,MEO PERSIAN ADULT,,,,5
,83,MEO PERSIAN KITTEN,,,,1
,84,MEO SALMON 1.1 KG,,,,1
,85,MEO TUNA ADULT SACHET,,,,11
,86,MEO TUNA KITTEN SACHET,,,,5
,87,MEO TUNA 1.2 KG,,,,1
,88,MEO TUNA ADULT 400 GR,,,,15
,89,MEO TUNA KITTEN 400 GR,,,,6
,90,MR PUSS SALMON 500 GR,,,,39
,91,MR PUSS TUNA 500 GR,,,,17
,92,MR VET CREAMY PREBIOTIC 60 GR,,,,5
,93,MR VET CREAMY TAURINE 60 GR,,,,11
,94,MR VET LYSINE 400 GR,,,,21
,95,MR VET OMEGA 400 GR,,,,21
,96,MR VET HAIR AND SKIN T2 1 KG,,,,1
,97,MR VET URINARY CARE T3 1 KG,,,,2
,98,MR VET INDOOR CARE T4 1 KG,,,,1
,99,NATIVE GOLD,,,,1
,100,ORICAT TUNA KITTEN 1 KG,,,,21
,101,ORICAT PURE TUNA 400 GR,,,,23
,102,ORICAT TUNA ADULT ,,,,19
,103,PAKET BOTOL DOT,,,,3
,104,PARFUM BIOPET,,,,2
,105,PARFUM BULBUL,,,,4
,106,PET CAGE DRY 50 CM STANDAR,,,,2
,107,PET CAGE KA-02 61X42,,,,1
,108,PET CARGO 2010,,,,3
,109,PET CARGO KN-1000,,,,4
,110,PET CARRIER MOTIF BATIK,,,,1
,111,PET CARRIER TRANSPARAN,,,,1
,112,REFILL ROLLER PEMBERSIH,,,,1
,113,REMOV ANTI BAU 250 ML,,,,1
,114,REMOV ANTIBIOTIK ,,,,1
,115,REMOV BATUK,,,,1
,116,REMOV DEMAM,,,,2
,117,REMOV PENURUN BIRAHI,,,,1
,118,ROLLER PEMBERSIH,,,,9
,119,ROYAL CANIN HAIR AND SKIN,,,,1
,120,ROYAL CANIN PERSIAN ADULT,,,,0
,121,ROYAL CANIN URINARY CARE,,,,1
,122,ROYAL CARE DIARE,,,,0
,123,ROYAL CARE SARIAWAN,,,,1
,124,ROYAL CARE TELINGA 10 ML,,,,4
,125,RUBY 5 LITTER,,,,6
,126,SCABIES CREAM,,,,1
,127,SCADIX CAT,,,,6
,128,SEROKAN HEWAN BENTUK KOTAK,,,,6
,129,SEROKAN HEWAN GANTUNG,,,,10
,130,SEROKAN HEWAN JUMBO,,,,9
,131,SEROKAN HEWAN PANJANG,,,,7
,132,SHAMPO FELIS 100 ML,,,,4
,133,SHAMPO KEEVA 100 ML,,,,0
,134,SISIR KUCING PERSEGI PANJANG,,,,1
,135,SISIR KUTU,,,,6
,136,SMART HEART RABBIT RASPBERRY,,,,1
,137,SMART HEART RABBIT VEGGIS&CEREAL,,,,1
,138,SPRAY TWO CLEAN,,,,1
,139,TALI ROMPI HEWAN,,,,1
,140,TARO 25 L,,,,1
,141,TARO 10 L,,,,3
,142,TARO 5 L,,,,8
,143,TARO LITTER REPACK 1 KG,,,,25
,144,TARO TOFU 7 L,,,,4
,145,TAS KUCING JINJING MODEL ASTRONOT,,,,1
,146,TAS KUCING JINJING  ,,,,2
,147,TEMPAT MAKAN DAN MINUM DISPENSER,,,,8
,148,TEMPAT MAKAN DOBEL DISPENSER,,,,10
,149,TEMPAT MAKAN HEWAN BULAT ANTI SEMUT,,,,6
,150,TEMPAT MAKAN HEWAN DOBEL ANTI SEMUT,,,,5
,151,TEMPAT MAKAN HEWAN DOBEL STAINLESS STEEL UK 18 CM,,,,1
,152,TEMPAT MAKAN HEWAN DOBEL STAINLESS STEEL UK 21 CM,,,,1
,153,TEMPAT MAKAN HEWAN MODEL TULANG,,,,7
,154,TEMPAT MAKAN HEWAN MOTIF ANGKA DELAPAN,,,,4
,155,TEMPAT MAKAN HEWAN MOTIF OVAL ANTI SEMUT,,,,3
,156,TEMPAT MAKAN HEWAN MOTIF TULANG ANTI SEMUT,,,,11
,157,TEMPAT MAKAN HEWAN SINGLE MOTIF KEPALA,,,,9
,158,TEMPAT MAKAN HEWAN STAINLESS STEEL SINGLE UK 15 CM,,,,1
,159,TEMPAT MAKAN HEWAN STAINLESS STEEL SINGLE UK 18 CM,,,,2
,160,TEMPAT MAKAN MINIMALIS,,,,7
,161,TOP CAT 10 L,,,,1
,162,TOP CAT 25 L,,,,1
,163,TOP CAT 5 L,,,,6
,164,TOP GROWTH,,,,4
,165,TOP LITTER 1 KG,,,,16
,166,TREATS LIEBAO,,,,11
,167,TRIXIN TETES MATA,,,,1
,168,TUTUP KALENG,,,,5
,169,VISCCO OIL MERAH,,,,1
,170,VIT VET PARFUM,,,,1
,171,VITA PLUS,,,,3
,172,VITA RABBIT 1 KG,,,,2
,173,WHISKAS JUNIOR OCEAN FISH 1.1 KG,,,,3
,174,WHISKAS MACKEREL ADULT 85 GR,,,,8
,175,WHISKAS MACKEREL JUNIOR 80 GR,,,,28
,176,WHISKAS TUNA 400 GR,,,,18
,177,WHISKAS TUNA ADULT 1.2 KG,,,,1
,178,WHISKAS TUNA ADULT 85 GR,,,,14
,179,WHISKAS TUNA JUNIOT 80 GR,,,,31
,180,WOODEN FEATHER,,,,4
,181,ROYAL CARE DEMAM',,,,4
,182,ALAS PIPIS,,,,5
,183,MEO BEEF AND VEGETABLE 1.2 KG,,,,1
,184,MR VET BONE 70GR POUCH,,,,12
,185,MR VET OMEGA 70GR POUCH,,,,12
,186,ORICAT TUNA AND SHRIMP,,,,23
,187,ROYAL CANIN KITTEN,,,,1
,188,SEROKAN HEWAN BENTUK OVAL,,,,7
,,TEMPAT MAKAN DUDUKAN BUNGA,,,,1
,,TEMPAT MAKAN KAKI TINGGI,,,,2
`;

function normalizeName(name: string): string {
  return name
    .toUpperCase()
    .replace(/^'+|'+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function categorize(name: string): string {
  const n = name.toUpperCase();
  if (
    n.includes("LITTER") ||
    n.includes("TOFU") ||
    n.includes("TARO 25 L") ||
    n.includes("TARO 10 L") ||
    n.includes("TARO 5 L") ||
    n.includes("TOP CAT") ||
    n.includes("ALAS PIPIS")
  ) {
    return "LITTER";
  }
  if (
    n.includes("DRINK") ||
    n.includes("BOTOL MINUM") ||
    n.includes("GROWSSY") ||
    n.includes("COLLOSTRUM")
  ) {
    return "DRINK";
  }
  if (
    n.includes("OBAT") ||
    n.includes("SIRUP") ||
    n.includes("BATUXIN") ||
    n.includes("CATYZOLE") ||
    n.includes("DETICK") ||
    n.includes("DRONTAL") ||
    n.includes("FOCAT SUPLEMEN") ||
    n.includes("FOCAT MATA") ||
    n.includes("IMMUNE BOOSTER") ||
    n.includes("REMOV") ||
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
    n.includes("POUCH") ||
    n.includes("400 GR") ||
    n.includes("CREAMY") ||
    n.includes("TREATS") ||
    n.includes("85 GR") ||
    n.includes("80 GR") ||
    n.includes("70GR") ||
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
    n.includes("POUCH") ||
    (category === "WET" &&
      (n.includes("85 GR") || n.includes("80 GR") || n.includes("70GR")))
  ) {
    return "SACHET";
  }
  if (category === "DRY" && (n.includes("KG") || n.includes("GR") || n.includes("ROYAL CANIN"))) {
    return "BKS";
  }
  return "PCS";
}

async function main() {
  console.log("🚀 Memulai sinkronisasi data barang terbaru dari client...");

  const [categories, units, existingProducts, stockSums] = await Promise.all([
    prisma.category.findMany(),
    prisma.unit.findMany(),
    prisma.product.findMany(),
    prisma.stockBatch.groupBy({
      by: ["productId"],
      where: { qtyRemaining: { gt: 0 } },
      _sum: { qtyRemaining: true },
    }),
  ]);

  const categoryMap = new Map(categories.map((c) => [c.name, c.id]));
  const unitMap = new Map(units.map((u) => [u.code, u.id]));
  const stockMap = new Map(
    stockSums.map((s) => [s.productId, Number(s._sum.qtyRemaining ?? 0)])
  );
  const usedCodes = new Set(existingProducts.map((p) => p.code));

  const lines = LATEST_CSV_DATA.trim().split("\n");
  console.log(`📋 Total baris data terbaru: ${lines.length}`);

  let updatedStockCount = 0;
  let unchangedCount = 0;
  let createdCount = 0;
  let nextSeq = 182;

  for (const line of lines) {
    const parts = line.split(",");
    const rawName = parts[2]
      ? parts[2].trim().replace(/^'+|'+$/g, "").trim()
      : "";
    if (!rawName) continue;

    const targetStock = Math.max(0, Number(parts[6]?.trim() ?? 0) || 0);
    const norm = normalizeName(rawName);

    // Cari produk yang sudah ada (cocok persis atau prefix seperti ORICAT TUNA AND SHRIMP -> ... 400 GR)
    let product =
      existingProducts.find((p) => normalizeName(p.name) === norm) ??
      existingProducts.find((p) => normalizeName(p.name).startsWith(norm));

    if (!product) {
      const catName = categorize(rawName);
      const catId = categoryMap.get(catName) ?? categories[0].id;
      const baseUnitCode = getBaseUnitCode(rawName, catName);
      const baseUnitId = unitMap.get(baseUnitCode) ?? unitMap.get("PCS")!;

      let code = `PRD-${String(nextSeq).padStart(4, "0")}`;
      while (usedCodes.has(code)) {
        nextSeq += 1;
        code = `PRD-${String(nextSeq).padStart(4, "0")}`;
      }
      usedCodes.add(code);
      nextSeq += 1;

      product = await prisma.product.create({
        data: {
          code,
          name: rawName,
          categoryId: catId,
          baseUnitId,
          marginPercent: new Decimal(10),
          minStock: new Decimal(5),
          isActive: true,
        },
      });
      existingProducts.push(product);
      createdCount += 1;
      console.log(`✨ Produk baru: ${product.code} — ${product.name} (${catName}, ${baseUnitCode})`);
    }

    const currentStock = stockMap.get(product.id) ?? 0;
    const diff = targetStock - currentStock;

    if (Math.abs(diff) < 0.0001) {
      unchangedCount += 1;
      continue;
    }

    if (diff > 0) {
      const costPerBase =
        product.buyPrice && Number(product.buyPrice) > 0
          ? product.buyPrice
          : new Decimal(0);
      const sellPricePerBase =
        product.sellPrice && Number(product.sellPrice) > 0
          ? product.sellPrice
          : new Decimal(0);

      const batch = await prisma.stockBatch.create({
        data: {
          productId: product.id,
          qtyIn: new Decimal(diff),
          qtyRemaining: new Decimal(diff),
          costPerBase,
          marginPercent: new Decimal(10),
          sellPricePerBase,
          receivedAt: new Date(),
        },
      });

      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          batchId: batch.id,
          type: "ADJUSTMENT",
          qtyBase: new Decimal(diff),
          refType: "SyncDataTerbaru",
          refId: batch.id,
          note: `Penyesuaian stok terbaru (${currentStock} → ${targetStock})`,
        },
      });
    } else {
      let toDeduct = new Decimal(Math.abs(diff));
      const activeBatches = await prisma.stockBatch.findMany({
        where: { productId: product.id, qtyRemaining: { gt: 0 } },
        orderBy: [{ receivedAt: "asc" }, { id: "asc" }],
      });

      for (const batch of activeBatches) {
        if (toDeduct.lte(0)) break;
        const take = Decimal.min(toDeduct, batch.qtyRemaining);

        await prisma.stockBatch.update({
          where: { id: batch.id },
          data: { qtyRemaining: batch.qtyRemaining.minus(take) },
        });

        await prisma.stockMovement.create({
          data: {
            productId: product.id,
            batchId: batch.id,
            type: "ADJUSTMENT",
            qtyBase: take.negated(),
            refType: "SyncDataTerbaru",
            refId: batch.id,
            note: `Penyesuaian stok terbaru (${currentStock} → ${targetStock})`,
          },
        });

        toDeduct = toDeduct.minus(take);
      }
    }

    stockMap.set(product.id, targetStock);
    updatedStockCount += 1;
  }

  console.log("\n✅ SINKRONISASI SELESAI!");
  console.log(`- Produk baru ditambahkan : ${createdCount}`);
  console.log(`- Stok produk diperbarui  : ${updatedStockCount}`);
  console.log(`- Stok sudah sama         : ${unchangedCount}`);
}

main()
  .catch((e) => {
    console.error("❌ Error sinkronisasi:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
