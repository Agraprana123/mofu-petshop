import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

const rawData = [
  { "id": "cmraxu8w500mrsl0tpz5h7hnz", "code": "PRD-0069", "name": "ALBENWORM SIRUPd", "category": "OBAT&KOSMETIK", "stock": 1, "minStock": 5, "unit": "PCS", "isCritical": true },
  { "id": "cmraxvger010zsl0t4hwibehs", "code": "PRD-0112", "name": "BAJU KUCING SEMUA UKURAN", "category": "AKSESORIS", "stock": 8, "minStock": 2, "unit": "PCS", "isCritical": false },
  { "id": "cmraxvsfp014vsl0tqn9mpcm7", "code": "PRD-0124", "name": "BAK TAHU UKURAN L", "category": "AKSESORIS", "stock": 1, "minStock": 2, "unit": "PCS", "isCritical": true },
  { "id": "cmraxvrkt014jsl0t9ox2i4nw", "code": "PRD-0123", "name": "BAK TAHU UKURAN M", "category": "AKSESORIS", "stock": 4, "minStock": 2, "unit": "PCS", "isCritical": false },
  { "id": "cmraxvqrc0147sl0tj0l17s4r", "code": "PRD-0122", "name": "BAK TAHU UKURAN S", "category": "AKSESORIS", "stock": 2, "minStock": 2, "unit": "PCS", "isCritical": true },
  { "id": "cmraxum7i00pdsl0t276abjv8", "code": "PRD-0077", "name": "BATUXIN", "category": "OBAT&KOSMETIK", "stock": 3, "minStock": 3, "unit": "PCS", "isCritical": true },
  { "id": "cmraxt5so00b5sl0t294nepnt", "code": "PRD-0034", "name": "BEAUTY CAT 20 KG / 1KG", "category": "DRY", "stock": 21, "minStock": 5, "unit": "GR/KG", "isCritical": false },
  { "id": "cmraxvwdc0167sl0tpzgsxwdc", "code": "PRD-0128", "name": "BEAUTY CAT GOLD 15 KG", "category": "DRY", "stock": 8, "minStock": 5, "unit": "BKS", "isCritical": false },
  { "id": "cmraxvt9r0157sl0tbtqjww5p", "code": "PRD-0125", "name": "BOLA BEL KARET", "category": "AKSESORIS", "stock": 10, "minStock": 5, "unit": "PCS", "isCritical": false },
  { "id": "cmraxvua2015jsl0tlly4843t", "code": "PRD-0126", "name": "BOLA BEL PLASTIK", "category": "AKSESORIS", "stock": 7, "minStock": 5, "unit": "PCS", "isCritical": false },
  { "id": "cmraxutaq00s1sl0tixgyf458", "code": "PRD-0085", "name": "BOLA BEL PLASTIK HOLLOW", "category": "AKSESORIS", "stock": 9, "minStock": 5, "unit": "PCS", "isCritical": false },
  { "id": "cmraxusik00rpsl0tjvxmsfwq", "code": "PRD-0084", "name": "BOLA SPIRAL ISI TIKUS", "category": "AKSESORIS", "stock": 4, "minStock": 2, "unit": "PCS", "isCritical": false },
  { "id": "cmraxrwe80015sl0tdljt4hg0", "code": "PRD-0004", "name": "BOLT CAT DONAT 20 KG FRESHPACK", "category": "DRY", "stock": 19, "minStock": 10, "unit": "GR/KG", "isCritical": false },
  { "id": "cmraxrov40005sl0to1pmhcbx", "code": "PRD-0001", "name": "BOLT CAT IKAN 20 KG FRESH PACK", "category": "DRY", "stock": 14, "minStock": 5, "unit": "GR/KG", "isCritical": false },
  { "id": "cmraxrrtj000hsl0t7scnbv5z", "code": "PRD-0002", "name": "BOLT CAT SALMON 20 KG FRESHPACK", "category": "DRY", "stock": 21, "minStock": 10, "unit": "GR/KG", "isCritical": false },
  { "id": "cmraxru2i000tsl0t7ck3brkn", "code": "PRD-0003", "name": "BOLT KITTEN TUNA 20 KG/ ISI 40 PCS", "category": "DRY", "stock": 38, "minStock": 5, "unit": "GR/KG", "isCritical": false },
  { "id": "cmraxvflr010nsl0ti17bmdxm", "code": "PRD-0111", "name": "BOTOL DOT HEWAN", "category": "AKSESORIS", "stock": 4, "minStock": 1, "unit": "PCS", "isCritical": false },
  { "id": "cmt7d860m0002zcxm0f62nv70", "code": "PRD-67037881", "name": "BOTOL MINUM HAMSTER/KELINCI 60ML", "category": "AKSESORIS", "stock": 5, "minStock": 0, "unit": "PCS", "isCritical": false },
  { "id": "cmraxsgi3004tsl0tuyhg1qbt", "code": "PRD-0015", "name": "CAT CHOICE CANNED ADULT TUNA 400 GR", "category": "WET", "stock": 22, "minStock": 10, "unit": "KLG", "isCritical": false },
  { "id": "cmraxsfjz004hsl0tturckcdj", "code": "PRD-0014", "name": "CAT CHOICE CANNED KITTEN TUNA 400 GR", "category": "WET", "stock": 14, "minStock": 5, "unit": "KLG", "isCritical": false },
  { "id": "cmraxsecl0045sl0t6htu71ie", "code": "PRD-0013", "name": "CAT CHOICE SALMON ADULT 20 KG", "category": "DRY", "stock": 23, "minStock": 5, "unit": "GR/KG", "isCritical": false },
  { "id": "cmraxsd80003tsl0t9vfollkp", "code": "PRD-0012", "name": "CAT CHOICE SALMON KITTEN 20 KG", "category": "DRY", "stock": 12, "minStock": 5, "unit": "GR/KG", "isCritical": false },
  { "id": "cmraxscck003hsl0tpqx5vbbv", "code": "PRD-0011", "name": "CAT CHOICE TUNA ADULT 20 KG", "category": "DRY", "stock": 4, "minStock": 5, "unit": "GR/KG", "isCritical": true },
  { "id": "cmraxsacf0035sl0tmrqycp61", "code": "PRD-0010", "name": "CAT CHOICE TUNA KITTEN 20 KG", "category": "DRY", "stock": 18, "minStock": 5, "unit": "GR/KG", "isCritical": false },
  { "id": "cmw515q0k001ei9gymp758ac5", "code": "PRD-19275064", "name": "CAT LITTER DEODORIZING 250ML", "category": "OBAT&KOSMETIK", "stock": 1, "minStock": 0, "unit": "PCS", "isCritical": false },
  { "id": "cmsnc4bra0002fdedlg7gf82f", "code": "PRD-43941637", "name": "CATSRANG ALL STAGES", "category": "DRY", "stock": 0, "minStock": 0, "unit": "PCS", "isCritical": true },
  { "id": "cmraxu49100lfsl0t504lwqc6", "code": "PRD-0065", "name": "CATTYZOLE CACING 100ML", "category": "OBAT&KOSMETIK", "stock": 5, "minStock": 2, "unit": "PCS", "isCritical": false },
  { "id": "cmraxt3cd00ahsl0tnlq24uww", "code": "PRD-0032", "name": "CHESTER 20 KG / 800 GR", "category": "DRY", "stock": 23, "minStock": 12, "unit": "GR/KG", "isCritical": false },
  { "id": "cmraxvd1m00znsl0ta8ky0qu9", "code": "PRD-0108", "name": "COLAR HEWAN BESAR", "category": "AKSESORIS", "stock": 2, "minStock": 1, "unit": "PCS", "isCritical": false },
  { "id": "cmraxves7010bsl0trr48kdta", "code": "PRD-0110", "name": "COLAR HEWAN KECIL", "category": "AKSESORIS", "stock": 1, "minStock": 1, "unit": "PCS", "isCritical": true },
  { "id": "cmu1dngqn0002566v8dpih39q", "code": "PRD-57292923", "name": "COLLESTRUM", "category": "DRINK", "stock": 14, "minStock": 0, "unit": "PCS", "isCritical": false },
  { "id": "cmraxu7tq00mfsl0tvz7o2sl0", "code": "PRD-0068", "name": "DETICK 1 ML", "category": "OBAT&KOSMETIK", "stock": 1, "minStock": 2, "unit": "PCS", "isCritical": true },
  { "id": "cmuxlqfsk0002y753olb72yzf", "code": "PRD-90167986", "name": "DOG CHOICE ADULT BEEF", "category": "DRY", "stock": 24, "minStock": 0, "unit": "PCS", "isCritical": false },
  { "id": "cmraxulaw00p1sl0tz43kueln", "code": "PRD-0076", "name": "DRONTAL CAT", "category": "OBAT&KOSMETIK", "stock": 4, "minStock": 5, "unit": "PCS", "isCritical": true },
  { "id": "cmrpvosea000848cflo74ddb2", "code": "PRD-17622317", "name": "EVA BIG MAT GREEY", "category": "AKSESORIS", "stock": 0, "minStock": 0, "unit": "GR", "isCritical": true },
  { "id": "cmraxs6bm0025sl0tbyg8ugnw", "code": "PRD-0007", "name": "EXCEL BABYMOM 20 KG", "category": "DRY", "stock": 42, "minStock": 5, "unit": "GR/KG", "isCritical": false },
  { "id": "cmraxs40n001tsl0to8hwkh64", "code": "PRD-0006", "name": "EXCEL CAT DONAT 20 KG", "category": "DRY", "stock": 30, "minStock": 5, "unit": "GR/KG", "isCritical": false },
  { "id": "cmraxs1xy001hsl0tu217gx8d", "code": "PRD-0005", "name": "EXCEL CAT IKAN 20 KG", "category": "DRY", "stock": 30, "minStock": 5, "unit": "GR/KG", "isCritical": false },
  { "id": "cmraxs7dq002hsl0t9256dvlg", "code": "PRD-0008", "name": "EXCEL CAT SALMON 20 KG", "category": "DRY", "stock": 24, "minStock": 5, "unit": "GR/KG", "isCritical": false },
  { "id": "cmraxs8rz002tsl0tcbj8qfdp", "code": "PRD-0009", "name": "EXCEL CAT SEGITIGA 20 KG", "category": "DRY", "stock": 27, "minStock": 5, "unit": "GR/KG", "isCritical": false },
  { "id": "cmraxshs50055sl0tstzu6mid", "code": "PRD-0016", "name": "FELIBET DONAT 20 KG", "category": "DRY", "stock": 36, "minStock": 20, "unit": "GR/KG", "isCritical": false },
  { "id": "cmraxsl4r0065sl0tnt2cb4s7", "code": "PRD-0019", "name": "FELIBET MOTHER AND KITTEN 20 KG", "category": "DRY", "stock": 20, "minStock": 5, "unit": "GR/KG", "isCritical": false },
  { "id": "cmraxsjoq005tsl0tm5stgk7i", "code": "PRD-0018", "name": "FELIBET SALMON CAT 20 KG", "category": "DRY", "stock": 36, "minStock": 5, "unit": "GR/KG", "isCritical": false },
  { "id": "cmraxvx8n016jsl0tbumkoyus", "code": "PRD-0129", "name": "FELIBET TUNA 20 KG", "category": "DRY", "stock": 16, "minStock": 5, "unit": "BKS", "isCritical": false },
  { "id": "cmraxsips005hsl0tjv3cfuew", "code": "PRD-0017", "name": "FELIBET TUNA OTORO 20 KG", "category": "DRY", "stock": 38, "minStock": 5, "unit": "GR/KG", "isCritical": false },
  { "id": "cmraxurr600rdsl0tmwpno0u5", "code": "PRD-0083", "name": "FISHING ROD TIKUS", "category": "AKSESORIS", "stock": 7, "minStock": 3, "unit": "PCS", "isCritical": false },
  { "id": "cmw50m146000ei9gyxk4qt7d8", "code": "PRD-31768768", "name": "FOCAR SUPLEMEN TINGGI PROTEIN/BULU", "category": "OBAT&KOSMETIK", "stock": 1, "minStock": 0, "unit": "GR", "isCritical": false },
  { "id": "cms4rvsfa000ny5yf73isz3tg", "code": "PRD-25955043", "name": "FOCAT MATA 10ML", "category": "OBAT&KOSMETIK", "stock": 0, "minStock": 0, "unit": "GR", "isCritical": true },
  { "id": "cmsla06ec00029ppgcw146c3p", "code": "PRD-92325015", "name": "FOCAT SISIR GROOMING", "category": "AKSESORIS", "stock": 2, "minStock": 1, "unit": "PCS", "isCritical": false },
  { "id": "cmraxsztm009hsl0t0ku91ki8", "code": "PRD-0029", "name": "FURLOVE TUNA ADULT 20 KG", "category": "DRY", "stock": 14, "minStock": 5, "unit": "GR/KG", "isCritical": false },
  { "id": "cmraxsyfj0095sl0tp3pa6q44", "code": "PRD-0028", "name": "FURLOVE TUNA KITTEN 20 KG", "category": "DRY", "stock": 20, "minStock": 5, "unit": "GR/KG", "isCritical": false },
  { "id": "cmraxu2hy00l3sl0tpoixqnzd", "code": "PRD-0064", "name": "GOAT MILK COLLESTRUM/ORGINAL PERKOTAK", "category": "DRINK", "stock": 14, "minStock": 5, "unit": "SACHET", "isCritical": false },
  { "id": "cmu1dcrr9000212rcqf2ii461", "code": "PRD-67801886", "name": "GROWSY", "category": "DRINK", "stock": 21, "minStock": 0, "unit": "PCS", "isCritical": false },
  { "id": "cmraxu1l200krsl0t9m140lzu", "code": "PRD-0063", "name": "GROWYS PER KOTAK", "category": "DRINK", "stock": 14, "minStock": 5, "unit": "SACHET", "isCritical": false },
  { "id": "cmraxvdzs00zzsl0tm03iaqyj", "code": "PRD-0109", "name": "GUNTING KUKU HEWAN", "category": "AKSESORIS", "stock": 2, "minStock": 2, "unit": "PCS", "isCritical": true },
  { "id": "cmw51amrh001wi9gyov5zckuw", "code": "PRD-09572196", "name": "HAM MEAL (HAMSTER FOOD)", "category": "DRY", "stock": 1, "minStock": 0, "unit": "PCS", "isCritical": false },
  { "id": "cmraxuq2y00qpsl0tnmbxwqb6", "code": "PRD-0081", "name": "HARNESS KUCING WARNA WARNI BERMOTIF", "category": "AKSESORIS", "stock": 11, "minStock": 5, "unit": "PCS", "isCritical": false },
  { "id": "cmvdl40o20003vhxg3053guur", "code": "PRD-05702628", "name": "HEALTY PET ALL STAGES", "category": "DRY", "stock": 0, "minStock": 0, "unit": "PCS", "isCritical": true },
  { "id": "cmw521fh40002ijxc0ndsb5mb", "code": "PRD-12484325", "name": "HOLYCAT URINE CARE", "category": "OBAT&KOSMETIK", "stock": 1, "minStock": 0, "unit": "PCS", "isCritical": false },
  { "id": "cmw50jo580008i9gym9w53goy", "code": "PRD-19402185", "name": "IMMUNE BOOSTER 20ML", "category": "OBAT&KOSMETIK", "stock": 1, "minStock": 0, "unit": "PCS", "isCritical": false },
  { "id": "cmraxuvs500t1sl0t74l5gvo2", "code": "PRD-0088", "name": "KALUNG KUCING BAHAN KULIT SINTETIS", "category": "AKSESORIS", "stock": 16, "minStock": 5, "unit": "PCS", "isCritical": false },
  { "id": "cmraxuxc200tpsl0tja5r8ppf", "code": "PRD-0090", "name": "KALUNG KUCING MOTIF KARAKTER", "category": "AKSESORIS", "stock": 30, "minStock": 5, "unit": "PCS", "isCritical": false },
  { "id": "cmraxvhac011bsl0tfttsyao1", "code": "PRD-0113", "name": "KALUNG MODEL JEPANG ANTI KUTU", "category": "AKSESORIS", "stock": 2, "minStock": 1, "unit": "PCS", "isCritical": false },
  { "id": "cmraxta2u00cfsl0tayidlduv", "code": "PRD-0038", "name": "KICTHEN FLAVOR ADULT 1.5 KG", "category": "DRY", "stock": 6, "minStock": 5, "unit": "KG", "isCritical": false },
  { "id": "cmvdl793s001avhxgkmxrei9i", "code": "PRD-27274167", "name": "LASER MAINAN", "category": "AKSESORIS", "stock": 3, "minStock": 0, "unit": "GR", "isCritical": false },
  { "id": "cmraxsnup006tsl0truig2g3o", "code": "PRD-0021", "name": "LEZATO SALMON ADULT 20 KG", "category": "DRY", "stock": 17, "minStock": 5, "unit": "GR/KG", "isCritical": false },
  { "id": "cmraxsmgg006hsl0t8851wx6k", "code": "PRD-0020", "name": "LEZATO TUNA ADULT 20 KG/1KG", "category": "DRY", "stock": 16, "minStock": 5, "unit": "GR/KG", "isCritical": false },
  { "id": "cmraxsp3g0075sl0tk14wtvwb", "code": "PRD-0022", "name": "LIFE CAT 20 KG/ 1 KG CURAH", "category": "DRY", "stock": 11, "minStock": 5, "unit": "GR/KG", "isCritical": false },
  { "id": "cmraxswbf008tsl0tu3lnep71", "code": "PRD-0027", "name": "LIFECAT CHICKEN KITTEN 85 GR", "category": "WET", "stock": 92, "minStock": 5, "unit": "SACHET", "isCritical": false },
  { "id": "cmraxsqk3007hsl0tppnfx3pf", "code": "PRD-0023", "name": "LIFECAT CHICKEN&SALMON 400 GR", "category": "WET", "stock": 14, "minStock": 5, "unit": "KLG", "isCritical": false },
  { "id": "cmraxsu0r0085sl0twmqgstlj", "code": "PRD-0025", "name": "LIFECAT SALMON KITTEN 400 GR", "category": "WET", "stock": 17, "minStock": 5, "unit": "KLG", "isCritical": false },
  { "id": "cmraxtzgt00k3sl0tl0e7rad7", "code": "PRD-0061", "name": "LIFECAT TOFU 7L", "category": "LITTER", "stock": 5, "minStock": 5, "unit": "PCS", "isCritical": true },
  { "id": "cmraxssub007tsl0tgy8bwdtp", "code": "PRD-0024", "name": "LIFECAT TUNA ADULT 400 GR", "category": "WET", "stock": 29, "minStock": 5, "unit": "KLG", "isCritical": false },
  { "id": "cmraxsvbc008hsl0tg1kg309x", "code": "PRD-0026", "name": "LIFECAT TUNA KITTEN 400 GR", "category": "WET", "stock": 31, "minStock": 5, "unit": "KLG", "isCritical": false },
  { "id": "cmraxuu0z00sdsl0tmz0rc74h", "code": "PRD-0086", "name": "MAINAN TIKUS", "category": "AKSESORIS", "stock": 3, "minStock": 3, "unit": "PCS", "isCritical": true },
  { "id": "cmu3ohxss0002vmmw962ibb2c", "code": "PRD-60288555", "name": "MARKOTOP CHICKEN AND SALMON KITTEN", "category": "DRY", "stock": 0, "minStock": 0, "unit": "GR", "isCritical": true },
  { "id": "cmu3okaw0000jvmmwnzb3ptgf", "code": "PRD-62861862", "name": "MARKOTOP CHICKEN AND SALMON KITTEN 2", "category": "DRY", "stock": 6, "minStock": 0, "unit": "GR", "isCritical": false },
  { "id": "cmv3kc6yo0002z2bl1s4k525e", "code": "PRD-05644076", "name": "MARKOTOP KITTEN TUNA SALMON", "category": "DRY", "stock": 23, "minStock": 0, "unit": "GR", "isCritical": false },
  { "id": "cmsezdlpx00097rkrwu3tibjd", "code": "PRD-29814868", "name": "MARKOTOP TUNA AND SALMON", "category": "DRY", "stock": 2, "minStock": 0, "unit": "PCS", "isCritical": false },
  { "id": "cmraxt6q600bhsl0tfr216tut", "code": "PRD-0035", "name": "MAXI 20 KG / 1 KG", "category": "DRY", "stock": 7, "minStock": 5, "unit": "GR/KG", "isCritical": false },
  { "id": "cmrfoyebm0002k3cavdu44b1v", "code": "PRD-10252674", "name": "MAXI 500 GR", "category": "DRY", "stock": 5, "minStock": 5, "unit": "GR", "isCritical": true },
  { "id": "cmrqcckcd000972h4j1byfnts", "code": "PRD-49511202", "name": "MEO CREAMY TREATS CHICKEN LIVER", "category": "WET", "stock": 10, "minStock": 6, "unit": "PCS", "isCritical": false },
  { "id": "cmrdj7ffr0045wxt6pjqf1qjd", "code": "PRD-23074459", "name": "MEO CREAMY TREATS SALMON", "category": "WET", "stock": 9, "minStock": 3, "unit": "PACK", "isCritical": false },
  { "id": "cmrqcaxk6000272h42o1gx2ve", "code": "PRD-70447587", "name": "MEO CREAMY TREATS TUNA SCALLOP", "category": "WET", "stock": 20, "minStock": 6, "unit": "PCS", "isCritical": false },
  { "id": "cmraxtesc00dfsl0ti4mba7u2", "code": "PRD-0041", "name": "MEO KITTEN 1.1 KG", "category": "DRY", "stock": 1, "minStock": 5, "unit": "KG", "isCritical": true },
  { "id": "cmseziru40002yxse64i940wq", "code": "PRD-25408175", "name": "MEO PERSIAN ADULT", "category": "DRY", "stock": 5, "minStock": 0, "unit": "PCS", "isCritical": false },
  { "id": "cmt7d9t0y0008zcxmgbrw1t7d", "code": "PRD-31884027", "name": "MEO PERSIAN KITTEN", "category": "DRY", "stock": 1, "minStock": 0, "unit": "PCS", "isCritical": false },
  { "id": "cmw50hcev0002i9gywny2921q", "code": "PRD-45506150", "name": "MEO SALMON 1.1 KG", "category": "DRY", "stock": 1, "minStock": 0, "unit": "GR", "isCritical": false },
  { "id": "cmraxti5100efsl0tq1gb9gj9", "code": "PRD-0044", "name": "MEO SASET TUNA ADULT", "category": "WET", "stock": 13, "minStock": 5, "unit": "SACHET", "isCritical": false },
  { "id": "cmraxth8n00e3sl0tcilscvzl", "code": "PRD-0043", "name": "MEO SASET TUNA KITTEN", "category": "WET", "stock": 5, "minStock": 5, "unit": "SACHET", "isCritical": true },
  { "id": "cmraxtfuc00drsl0t75nla4mb", "code": "PRD-0042", "name": "MEO TUNA 1.2 KG", "category": "DRY", "stock": 2, "minStock": 5, "unit": "KG", "isCritical": true },
  { "id": "cmraxtctw00d3sl0t3ttgilwf", "code": "PRD-0040", "name": "MEO TUNA ADULT 400 GR", "category": "WET", "stock": 17, "minStock": 5, "unit": "KLG", "isCritical": false },
  { "id": "cmraxtazt00crsl0txjltns2n", "code": "PRD-0039", "name": "MEO TUNA KITTEN 400 GR", "category": "WET", "stock": 8, "minStock": 5, "unit": "KLG", "isCritical": false },
  { "id": "cmraxt1c3009tsl0tr0n1j1za", "code": "PRD-0030", "name": "MR PUSS SALMON 20 KG", "category": "DRY", "stock": 17, "minStock": 5, "unit": "GR/KG", "isCritical": false },
  { "id": "cmraxt2ax00a5sl0t4hj0o761", "code": "PRD-0031", "name": "MR PUSS TUNA 20 KG", "category": "DRY", "stock": 21, "minStock": 5, "unit": "GR/KG", "isCritical": false },
  { "id": "cmrdiuzua003kwxt6rs0tzq5k", "code": "PRD-09724302", "name": "MR VET CREAMY PREBIOTIC 60 GR", "category": "WET", "stock": 5, "minStock": 0, "unit": "PACK", "isCritical": false },
  { "id": "cmrdixygj003rwxt65bad3grj", "code": "PRD-03985747", "name": "MR VET CREAMY TAURINE 60 GR", "category": "WET", "stock": 11, "minStock": 6, "unit": "PACK", "isCritical": false },
  { "id": "cmrdinx2m0036wxt6jpqb7sss", "code": "PRD-10078422", "name": "MR VET LYSINE 400 GR", "category": "WET", "stock": 21, "minStock": 12, "unit": "KLG", "isCritical": false },
  { "id": "cmrdiqe7d003dwxt669hg67v5", "code": "PRD-75593361", "name": "MR VET OMEGA 3 400 GR", "category": "WET", "stock": 21, "minStock": 12, "unit": "DUS", "isCritical": false },
  { "id": "cmtuacnxl000bpiggb3bs2rrl", "code": "PRD-97434166", "name": "MR VET T2 1 KG", "category": "DRY", "stock": 0, "minStock": 0, "unit": "KG", "isCritical": true },
  { "id": "cmraxtjqy00f3sl0tzaq0be0x", "code": "PRD-0046", "name": "MR VET T2-1KG", "category": "DRY", "stock": 0, "minStock": 1, "unit": "KG", "isCritical": true },
  { "id": "cmraxtiy800ersl0t4z2vvi8c", "code": "PRD-0045", "name": "MR VET T3-1KG", "category": "DRY", "stock": 2, "minStock": 1, "unit": "KG", "isCritical": false },
  { "id": "cmraxtkq200ffsl0tri778a86", "code": "PRD-0047", "name": "MR VET T4-1KG", "category": "DRY", "stock": 0, "minStock": 1, "unit": "KG", "isCritical": true },
  { "id": "cmutwvoam0002knsh9yp0n72l", "code": "PRD-43937402", "name": "MR VET T4-1KG 2", "category": "DRY", "stock": 1, "minStock": 0, "unit": "GR", "isCritical": false },
  { "id": "cms2ustw100024u1nk7wccuac", "code": "PRD-09987107", "name": "NATIVE GOLD", "category": "OBAT&KOSMETIK", "stock": 1, "minStock": 0, "unit": "GR", "isCritical": false },
  { "id": "cmraxt46m00atsl0tuivwtzxc", "code": "PRD-0033", "name": "ORI CAT TUNA KITTEN 20 KG", "category": "DRY", "stock": 21, "minStock": 5, "unit": "GR/KG", "isCritical": false },
  { "id": "cms4rre6l0007y5yf3wgf9yt5", "code": "PRD-62987497", "name": "ORICAT PURE TUNA 400 GR", "category": "WET", "stock": 15, "minStock": 0, "unit": "GR", "isCritical": false },
  { "id": "cmsx879pw0002vccm31bxc1fz", "code": "PRD-38254642", "name": "ORICAT TUNA ADULT", "category": "DRY", "stock": 19, "minStock": 0, "unit": "PACK", "isCritical": false },
  { "id": "cmraxvaip00ynsl0t4x9pi7s8", "code": "PRD-0105", "name": "PAKET BOTOL DOT", "category": "AKSESORIS", "stock": 3, "minStock": 1, "unit": "PCS", "isCritical": false },
  { "id": "cmw5198l0001qi9gyclvydimm", "code": "PRD-48577109", "name": "PARFUM BIOPET", "category": "OBAT&KOSMETIK", "stock": 2, "minStock": 0, "unit": "PCS", "isCritical": false },
  { "id": "cmraxu9qn00n1sl0tkno3gmpg", "code": "PRD-0070", "name": "PARFUM BUL BUL BABY POWDER", "category": "OBAT&KOSMETIK", "stock": 4, "minStock": 2, "unit": "PCS", "isCritical": false },
  { "id": "cmraxun6e00ppsl0t0id1rcf0", "code": "PRD-0078", "name": "PET CAGE DRY 50 CM STANDAR", "category": "AKSESORIS", "stock": 2, "minStock": 1, "unit": "PCS", "isCritical": false },
  { "id": "cmraxup2l00qdsl0tbqd4mo38", "code": "PRD-0080", "name": "PET CAGE KA-02 61X42", "category": "AKSESORIS", "stock": 1, "minStock": 1, "unit": "PCS", "isCritical": true },
  { "id": "cmrdj2rh9003ywxt61gz3ch1n", "code": "PRD-35002542", "name": "PET CARGO 2010", "category": "WET", "stock": 3, "minStock": 1, "unit": "PCS", "isCritical": false },
  { "id": "cmraxuo2p00q1sl0t4j792ho6", "code": "PRD-0079", "name": "PET CARGO KN-1000", "category": "AKSESORIS", "stock": 4, "minStock": 2, "unit": "PCS", "isCritical": false },
  { "id": "cmraxvnjp012zsl0tgoln904a", "code": "PRD-0118", "name": "PET CARRIER MOTIF BATIK", "category": "AKSESORIS", "stock": 1, "minStock": 0, "unit": "PCS", "isCritical": false },
  { "id": "cmraxvog10139sl0tjal6hrb3", "code": "PRD-0119", "name": "PET CARRIER TRANSPARAN", "category": "AKSESORIS", "stock": 1, "minStock": 0, "unit": "PCS", "isCritical": false },
  { "id": "cmraxvl5o011zsl0tq64x57bp", "code": "PRD-0115", "name": "REFILL ROLLER PEMBERSIH", "category": "AKSESORIS", "stock": 1, "minStock": 0, "unit": "PCS", "isCritical": false },
  { "id": "cmw5142y20018i9gyhcyv16hg", "code": "PRD-53413464", "name": "REMOV ANTI BAU 250 ML", "category": "OBAT&KOSMETIK", "stock": 1, "minStock": 0, "unit": "PCS", "isCritical": false },
  { "id": "cmw50sod40002q4ehleue3zaa", "code": "PRD-32231780", "name": "REMOV ANTIBIOTIK", "category": "OBAT&KOSMETIK", "stock": 2, "minStock": 0, "unit": "PCS", "isCritical": false },
  { "id": "cmw50vsim000eq4eh5p0246dd", "code": "PRD-85787909", "name": "REMOV BATUK", "category": "OBAT&KOSMETIK", "stock": 1, "minStock": 0, "unit": "PCS", "isCritical": false },
  { "id": "cmw50t9af0008q4ehmpyujoh4", "code": "PRD-03757314", "name": "REMOV DEMAM", "category": "OBAT&KOSMETIK", "stock": 2, "minStock": 0, "unit": "PCS", "isCritical": false },
  { "id": "cmw50x646000kq4ehtc8udr1u", "code": "PRD-28804030", "name": "REMOV PENURUN BIRAHI", "category": "OBAT&KOSMETIK", "stock": 1, "minStock": 0, "unit": "PCS", "isCritical": false },
  { "id": "cmraxvlzj012bsl0twvndxx4p", "code": "PRD-0116", "name": "ROLLER PEMBERSIH", "category": "AKSESORIS", "stock": 10, "minStock": 5, "unit": "PCS", "isCritical": false },
  { "id": "cmraxt99b00c5sl0t0j369tu1", "code": "PRD-0037", "name": "ROYAL CANIN HAIR N SKIN 400 GR", "category": "DRY", "stock": 1, "minStock": 0, "unit": "GR", "isCritical": false },
  { "id": "cmvnh4r5n000avpv2e2jtovvu", "code": "PRD-94152039", "name": "ROYAL CANIN PERSIAN ADULT", "category": "DRY", "stock": 0, "minStock": 0, "unit": "GR", "isCritical": true },
  { "id": "cmtpp4t4i000214f28xnu9qzh", "code": "PRD-65748932", "name": "ROYAL CANIN PERSIAN ADULT 2", "category": "DRY", "stock": 0, "minStock": 0, "unit": "GR", "isCritical": true },
  { "id": "cmvnh2x600002vpv2n09afko6", "code": "PRD-39075689", "name": "ROYAL CANIN URINARY", "category": "DRY", "stock": 1, "minStock": 0, "unit": "GR", "isCritical": false },
  { "id": "cmraxt81300btsl0t4e56alud", "code": "PRD-0036", "name": "ROYAL CANIN URINARY 400 GR", "category": "DRY", "stock": 0, "minStock": 1, "unit": "GR", "isCritical": true },
  { "id": "cmraxu5xo00lrsl0t6z6958bd", "code": "PRD-0066", "name": "ROYAL CARE DEMAM CAT 10 ML", "category": "OBAT&KOSMETIK", "stock": 4, "minStock": 2, "unit": "PCS", "isCritical": false },
  { "id": "cmuxlywmc0002vhj73ilb3xpc", "code": "PRD-40667022", "name": "ROYAL CARE DIARE CAT", "category": "OBAT&KOSMETIK", "stock": 2, "minStock": 0, "unit": "PCS", "isCritical": false },
  { "id": "cmw50nb8n000ki9gy6ytv3sqe", "code": "PRD-29531246", "name": "ROYAL CARE SARIAWAN", "category": "OBAT&KOSMETIK", "stock": 1, "minStock": 0, "unit": "PCS", "isCritical": false },
  { "id": "cmraxu6uj00m3sl0txqf7mln1", "code": "PRD-0067", "name": "ROYAL CARE TELINGA 10 ML", "category": "OBAT&KOSMETIK", "stock": 4, "minStock": 2, "unit": "PCS", "isCritical": false },
  { "id": "cms72nizz000283aea23j9uuz", "code": "PRD-32637456", "name": "RUBY LITTER 5 L", "category": "LITTER", "stock": 6, "minStock": 6, "unit": "BKS", "isCritical": true },
  { "id": "cmraxuhrr00odsl0tj9s1rmal", "code": "PRD-0074", "name": "SCABIES CREAM", "category": "OBAT&KOSMETIK", "stock": 2, "minStock": 3, "unit": "PCS", "isCritical": true },
  { "id": "cmraxugce00o1sl0tcsiv21o7", "code": "PRD-0073", "name": "SCADIX CAT", "category": "OBAT&KOSMETIK", "stock": 7, "minStock": 5, "unit": "PCS", "isCritical": false },
  { "id": "cmraxv6fc00x1sl0t9zc6lzqo", "code": "PRD-0100", "name": "SEROKAN HEWAN BENTUK KOTAK", "category": "AKSESORIS", "stock": 7, "minStock": 5, "unit": "PCS", "isCritical": false },
  { "id": "cmraxv7aa00xdsl0t55wgt0gf", "code": "PRD-0101", "name": "SEROKAN HEWAN BENTUK OVAL", "category": "AKSESORIS", "stock": 8, "minStock": 5, "unit": "PCS", "isCritical": false },
  { "id": "cmraxv92c00y1sl0tqel08tth", "code": "PRD-0103", "name": "SEROKAN HEWAN GANTUNG", "category": "AKSESORIS", "stock": 10, "minStock": 5, "unit": "PCS", "isCritical": false },
  { "id": "cmraxv4n000wdsl0t1q3o9xgo", "code": "PRD-0098", "name": "SEROKAN HEWAN JUMBO", "category": "AKSESORIS", "stock": 9, "minStock": 5, "unit": "PCS", "isCritical": false },
  { "id": "cmraxv86g00xpsl0tdoaalvw1", "code": "PRD-0102", "name": "SEROKAN HEWAN PANJANG", "category": "AKSESORIS", "stock": 7, "minStock": 5, "unit": "PCS", "isCritical": false },
  { "id": "cmraxuank00ndsl0tk55jsjgx", "code": "PRD-0071", "name": "SHAMPO FELIS 100 ML ALL", "category": "OBAT&KOSMETIK", "stock": 4, "minStock": 0, "unit": "PCS", "isCritical": false },
  { "id": "cmraxubr000npsl0tpi25o8bg", "code": "PRD-0072", "name": "SHAMPO KEEVA ALL VARIAN 100 ML", "category": "OBAT&KOSMETIK", "stock": 0, "minStock": 2, "unit": "PCS", "isCritical": true },
  { "id": "cmraxvbah00yzsl0twmet236x", "code": "PRD-0106", "name": "SISIR KUCING PERSEGI PANJANG", "category": "AKSESORIS", "stock": 1, "minStock": 0, "unit": "PCS", "isCritical": false },
  { "id": "cmraxvc4s00zbsl0t548x1gvg", "code": "PRD-0107", "name": "SISIR KUTU", "category": "AKSESORIS", "stock": 6, "minStock": 5, "unit": "PCS", "isCritical": false },
  { "id": "cmuxlw8jl000fmvyrolzbtm9n", "code": "PRD-95692424", "name": "SMARTHEART RABBIT RASPBERRY", "category": "DRY", "stock": 1, "minStock": 0, "unit": "PCS", "isCritical": false },
  { "id": "cmuxlv02k0009mvyrkgoy3lpi", "code": "PRD-21499924", "name": "SMARTHEART RABBIT VEGGIS&CEREAL", "category": "DRY", "stock": 1, "minStock": 0, "unit": "PCS", "isCritical": false },
  { "id": "cmw516w6v001ki9gyxnieaiyw", "code": "PRD-65512327", "name": "SPRAY TWO CLEAN", "category": "OBAT&KOSMETIK", "stock": 1, "minStock": 0, "unit": "GR", "isCritical": false },
  { "id": "cmraxvif2011nsl0t1wq5j6tk", "code": "PRD-0114", "name": "TALI ROMPI HEWAN", "category": "AKSESORIS", "stock": 1, "minStock": 1, "unit": "PCS", "isCritical": true },
  { "id": "cmraxtvof00irsl0trxnlxwz9", "code": "PRD-0057", "name": "TARO AQUA FRESH 25 L", "category": "LITTER", "stock": 1, "minStock": 1, "unit": "KRG", "isCritical": true },
  { "id": "cmraxtwws00j3sl0t7h4z7eqg", "code": "PRD-0058", "name": "TARO COTTON CANDY 10 L", "category": "LITTER", "stock": 5, "minStock": 5, "unit": "KRG", "isCritical": true },
  { "id": "cmraxtxrw00jfsl0t86j8b61p", "code": "PRD-0059", "name": "TARO COTTON CANDY 5L/6", "category": "LITTER", "stock": 5, "minStock": 5, "unit": "KRG", "isCritical": true },
  { "id": "cmrdphw9l001lhd8vyfmyfhud", "code": "PRD-84018464", "name": "TARO LITTER REPACK 1 KG", "category": "LITTER", "stock": 14, "minStock": 20, "unit": "KG", "isCritical": true },
  { "id": "cmraxtyk600jrsl0tioob6kc9", "code": "PRD-0060", "name": "TARO TOFU 7L", "category": "LITTER", "stock": 6, "minStock": 5, "unit": "PCS", "isCritical": false },
  { "id": "cmraxvp48013jsl0tnlalrged", "code": "PRD-0120", "name": "TAS KUCING JINJING", "category": "AKSESORIS", "stock": 2, "minStock": 1, "unit": "PCS", "isCritical": false },
  { "id": "cmraxv9uq00ydsl0ta8r20ddi", "code": "PRD-0104", "name": "TAS KUCING JINJING MODEL ASTRONOT", "category": "AKSESORIS", "stock": 1, "minStock": 0, "unit": "PCS", "isCritical": false },
  { "id": "cmraxuuu200spsl0tt9yvysj1", "code": "PRD-0087", "name": "TEMPAT MAKAN DAN MINUM DISPENSER", "category": "AKSESORIS", "stock": 8, "minStock": 5, "unit": "PCS", "isCritical": false },
  { "id": "cmraxuwk600tdsl0t7j5okk7w", "code": "PRD-0089", "name": "TEMPAT MAKAN DOBEL DISPENSER", "category": "AKSESORIS", "stock": 10, "minStock": 5, "unit": "PCS", "isCritical": false },
  { "id": "cmraxv5ij00wpsl0tlxaigo8f", "code": "PRD-0099", "name": "TEMPAT MAKAN HEWAN BULAT ANTI SEMUT", "category": "AKSESORIS", "stock": 6, "minStock": 5, "unit": "PCS", "isCritical": false },
  { "id": "cmraxv0mx00upsl0tv5sx8u7t", "code": "PRD-0093", "name": "TEMPAT MAKAN HEWAN DOBEL ANTI SEMUT", "category": "AKSESORIS", "stock": 5, "minStock": 5, "unit": "PCS", "isCritical": true },
  { "id": "cmv3b1ok90002s7f99s69miam", "code": "PRD-36977402", "name": "TEMPAT MAKAN HEWAN DOBEL STAINLESS STEEL UK 18", "category": "AKSESORIS", "stock": 1, "minStock": 0, "unit": "GR", "isCritical": false },
  { "id": "cmv3azy230002rx7772jvv772", "code": "PRD-38596250", "name": "TEMPAT MAKAN HEWAN DOBEL STAINLESS STEEL UK 21", "category": "AKSESORIS", "stock": 1, "minStock": 0, "unit": "GR", "isCritical": false },
  { "id": "cmraxv3r300w1sl0tnaep3jyf", "code": "PRD-0097", "name": "TEMPAT MAKAN HEWAN MODEL TULANG", "category": "AKSESORIS", "stock": 7, "minStock": 5, "unit": "PCS", "isCritical": false },
  { "id": "cmraxv1e300v1sl0t8tbcgy2y", "code": "PRD-0094", "name": "TEMPAT MAKAN HEWAN MOTIF ANGKA DELAPAN", "category": "AKSESORIS", "stock": 6, "minStock": 5, "unit": "PCS", "isCritical": false },
  { "id": "cmraxuzp400udsl0t4b46dqro", "code": "PRD-0092", "name": "TEMPAT MAKAN HEWAN MOTIF OVAL ANTI SEMUT", "category": "AKSESORIS", "stock": 3, "minStock": 5, "unit": "PCS", "isCritical": true },
  { "id": "cmraxuy6k00u1sl0t4tg5c6g0", "code": "PRD-0091", "name": "TEMPAT MAKAN HEWAN MOTIF TULANG ANTI SEMUT", "category": "AKSESORIS", "stock": 11, "minStock": 5, "unit": "PCS", "isCritical": false },
  { "id": "cmraxv2yu00vpsl0twsmel3e8", "code": "PRD-0096", "name": "TEMPAT MAKAN HEWAN SINGLE MOTIF KEPALA", "category": "AKSESORIS", "stock": 10, "minStock": 5, "unit": "PCS", "isCritical": false },
  { "id": "cmraxur0g00r1sl0t9ktym7e1", "code": "PRD-0082", "name": "TEMPAT MAKAN HEWAN STAINLESS STEEL 15 CM", "category": "AKSESORIS", "stock": 1, "minStock": 2, "unit": "PCS", "isCritical": true },
  { "id": "cmraxvvep015vsl0t8iowtkzz", "code": "PRD-0127", "name": "TEMPAT MAKAN HEWAN STAINLESS STEEL 18 CM", "category": "AKSESORIS", "stock": 3, "minStock": 2, "unit": "PCS", "isCritical": false },
  { "id": "cmraxv26400vdsl0tfxdfclgn", "code": "PRD-0095", "name": "TEMPAT MAKAN MINIMALIS", "category": "AKSESORIS", "stock": 7, "minStock": 5, "unit": "PCS", "isCritical": false },
  { "id": "cmraxttqz00i3sl0t3qv7rdzb", "code": "PRD-0055", "name": "TOP CAT 10 L", "category": "LITTER", "stock": 2, "minStock": 3, "unit": "KRG", "isCritical": true },
  { "id": "cmraxtso600hrsl0txv877tvt", "code": "PRD-0054", "name": "TOP CAT 25 L", "category": "LITTER", "stock": 0, "minStock": 2, "unit": "KRG", "isCritical": true },
  { "id": "cmraxtuti00ifsl0tvwqr1uci", "code": "PRD-0056", "name": "TOP CAT 5 L", "category": "LITTER", "stock": 2, "minStock": 5, "unit": "KRG", "isCritical": true },
  { "id": "cmu1dize8000c12rcp5fduidg", "code": "PRD-68289910", "name": "TOP GROWTH", "category": "DRINK", "stock": 7, "minStock": 0, "unit": "PCS", "isCritical": false },
  { "id": "cmraxu0b500kfsl0t7fy6ydzc", "code": "PRD-0062", "name": "TOP GROWTH PER BOX", "category": "DRINK", "stock": 11, "minStock": 5, "unit": "SACHET", "isCritical": false },
  { "id": "cmrfp21i70002znhvezlmjoio", "code": "PRD-10314414", "name": "TOP LITTER 1 KG", "category": "LITTER", "stock": 16, "minStock": 10, "unit": "KG", "isCritical": false },
  { "id": "cmtny9ngu0002kkpg6z09p0yq", "code": "PRD-67135813", "name": "TREATS  LIEBAO", "category": "WET", "stock": 23, "minStock": 10, "unit": "SACHET", "isCritical": false },
  { "id": "cmsby6h120002gb76u2rdjwhu", "code": "PRD-19627681", "name": "TRIXIN TETES MATA", "category": "OBAT&KOSMETIK", "stock": 0, "minStock": 1, "unit": "GR", "isCritical": true },
  { "id": "cmraxvmpr012nsl0thwstpjnx", "code": "PRD-0117", "name": "TUTUP KALENG", "category": "AKSESORIS", "stock": 5, "minStock": 2, "unit": "PCS", "isCritical": false },
  { "id": "cmrpvnc0d000248cf8q58ihnm", "code": "PRD-38986418", "name": "VISCO OIL MERAH ISI 25", "category": "OBAT&KOSMETIK", "stock": 1, "minStock": 1, "unit": "GR", "isCritical": true },
  { "id": "cmw50yzr6000qq4ehkojmezgq", "code": "PRD-68252957", "name": "VIT VET PARFUM", "category": "OBAT&KOSMETIK", "stock": 1, "minStock": 0, "unit": "PCS", "isCritical": false },
  { "id": "cmraxujio00opsl0t7i8arv0y", "code": "PRD-0075", "name": "VITA PLUS", "category": "OBAT&KOSMETIK", "stock": 3, "minStock": 2, "unit": "PCS", "isCritical": false },
  { "id": "cmuxlxitg000lmvyrqlz2vxvl", "code": "PRD-95328038", "name": "VITA RABBIT 1 KG", "category": "DRY", "stock": 1, "minStock": 0, "unit": "KG", "isCritical": false },
  { "id": "cmraxtlpx00frsl0t8y29pv25", "code": "PRD-0048", "name": "WHISKAS JUNIOR OCEAN FISH 1.1 KG", "category": "DRY", "stock": 3, "minStock": 5, "unit": "KG", "isCritical": true },
  { "id": "cmraxtqry00h3sl0t55me3htr", "code": "PRD-0052", "name": "WHISKAS MACKAREL ADULT 85 GR", "category": "WET", "stock": 14, "minStock": 5, "unit": "SACHET", "isCritical": false },
  { "id": "cmraxtro500hfsl0t5t271vk3", "code": "PRD-0053", "name": "WHISKAS MACKAREL KITTEN 80 GR", "category": "WET", "stock": 3, "minStock": 5, "unit": "SACHET", "isCritical": true },
  { "id": "cmraxtmmk00g3sl0trnqye85r", "code": "PRD-0049", "name": "WHISKAS TUNA 400 GR", "category": "WET", "stock": 18, "minStock": 5, "unit": "KLG", "isCritical": false },
  { "id": "cmszg6ece0002o0o9b58d3udz", "code": "PRD-36104322", "name": "WHISKAS TUNA ADULT 1.2 KG", "category": "DRY", "stock": 2, "minStock": 0, "unit": "PCS", "isCritical": false },
  { "id": "cmraxtoem00grsl0tv9g1nlk5", "code": "PRD-0051", "name": "WHISKAS TUNA ADULT 85 GR", "category": "WET", "stock": 18, "minStock": 5, "unit": "SACHET", "isCritical": false },
  { "id": "cmraxtnig00gfsl0t2y5pa9vx", "code": "PRD-0050", "name": "WHISKAS TUNA JUNIOR 85 GR", "category": "WET", "stock": 20, "minStock": 5, "unit": "SACHET", "isCritical": false },
  { "id": "cmraxvpvc013vsl0tybyyd4c8", "code": "PRD-0121", "name": "WOODEN FEATHER", "category": "AKSESORIS", "stock": 4, "minStock": 5, "unit": "PCS", "isCritical": true }
];

async function main() {
  console.log("🚀 Memulai import data produk riil ke database PostgreSQL...");

  // 1. Kumpulkan kategori unik & upsert
  const uniqueCategories = [...new Set(rawData.map((d) => d.category.trim()))];
  console.log(`📦 Menemukan ${uniqueCategories.length} kategori:`, uniqueCategories);

  const categoryMap = new Map<string, number>();
  for (const catName of uniqueCategories) {
    const cat = await prisma.category.upsert({
      where: { name: catName },
      update: {},
      create: {
        name: catName,
        defaultMarginPercent: new Decimal(10), // default margin 10%
      },
    });
    categoryMap.set(catName, cat.id);
  }

  // 2. Kumpulkan satuan unik & upsert
  const uniqueUnits = [...new Set(rawData.map((d) => d.unit.trim()))];
  console.log(`📏 Menemukan ${uniqueUnits.length} satuan:`, uniqueUnits);

  const unitMap = new Map<string, number>();
  for (const unitCode of uniqueUnits) {
    const unit = await prisma.unit.upsert({
      where: { code: unitCode },
      update: {},
      create: {
        code: unitCode,
        name: unitCode,
      },
    });
    unitMap.set(unitCode, unit.id);
  }

  // 3. Masukkan produk & inisialisasi batch stok
  console.log(`🛍️ Mengimpor ${rawData.length} produk...`);
  let importedCount = 0;
  let batchCreatedCount = 0;

  const usedCodes = new Set<string>();

  for (let idx = 0; idx < rawData.length; idx++) {
    const item = rawData[idx];
    const catId = categoryMap.get(item.category.trim())!;
    const unitId = unitMap.get(item.unit.trim())!;

    // Pastikan code unik & tidak kosong
    let code = item.code.trim();
    if (!code) {
      code = `PRD-AUTOGEN-${String(idx + 1).padStart(4, "0")}`;
    }
    if (usedCodes.has(code)) {
      code = `${code}-${idx + 1}`;
    }
    usedCodes.add(code);

    const product = await prisma.product.upsert({
      where: { code },
      update: {
        name: item.name.trim(),
        categoryId: catId,
        baseUnitId: unitId,
        isActive: true,
      },
      create: {
        code,
        name: item.name.trim(),
        categoryId: catId,
        baseUnitId: unitId,
        isActive: true,
      },
    });

    importedCount++;

    // Jika stok > 0, buat batch stok awal (agar sistem FIFO langsung memiliki stok riil)
    if (item.stock > 0) {
      // Cek apakah produk sudah punya batch
      const existingBatch = await prisma.stockBatch.findFirst({
        where: { productId: product.id },
      });

      if (!existingBatch) {
        const qtyDecimal = new Decimal(item.stock);
        const batch = await prisma.stockBatch.create({
          data: {
            productId: product.id,
            qtyIn: qtyDecimal,
            qtyRemaining: qtyDecimal,
            costPerBase: new Decimal(0), // Modal awal (akan ter-update otomatis saat ada faktur pembelian baru)
            receivedAt: new Date(),
          },
        });

        await prisma.stockMovement.create({
          data: {
            productId: product.id,
            batchId: batch.id,
            type: "ADJUSTMENT",
            qtyBase: qtyDecimal,
            refType: "SaldoAwalMigrasi",
            refId: batch.id,
          },
        });

        batchCreatedCount++;
      }
    }
  }

  console.log("\n✅ IMPORT SELESAI!");
  console.log(`- Kategori terdaftar : ${categoryMap.size}`);
  console.log(`- Satuan terdaftar   : ${unitMap.size}`);
  console.log(`- Total Produk aktif : ${importedCount}`);
  console.log(`- Batch Stok dibuat  : ${batchCreatedCount}`);
}

main()
  .catch((e) => {
    console.error("❌ Error import:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

