"""Deniz Kapısı QR menü metinlerini (dkmenu.com.tr) uygulama verisine çevirir.

Kullanım:
    python3 scripts/parse-menu.py <metin_klasörü> > src/data/menu.generated.json

<metin_klasörü>, dkmenu.com.tr sayfalarının görünür metnini içeren
breakfast.txt, lunch.txt, dinner.txt, dessert.txt, beverages.txt dosyalarını
barındırır. Çıktı uygulamada src/data/menu.ts tarafından okunur.
Menü güncellendiğinde metinleri yeniden alıp bu betiği tekrar çalıştırın;
uzun vadede menü bir yönetim panelinden (backend) gelmelidir.
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

ALLERGEN_RE = re.compile(r"\((WH|EG|PN|CY|LP|SE|SP|CS|SY|MD|MK|FH|TN|MS)\)")
PRICE_LINE_RE = re.compile(r"^\s*(₺\s*[\d.,]+(\s*/\s*₺\s*[\d.,]+)*|[\d.,]+₺(\s*/\s*[\d.,]+₺)*)\s*$")
UPPER_RE = re.compile(r"^[A-ZÇĞİÖŞÜ0-9 &/’'\-.]+$")

SERVICES = {
    "breakfast": ("kahvalti", "Kahvaltı", "09:00 – 12:00"),
    "lunch": ("oglen", "Öğlen", "12:00 – 18:00"),
    "dinner": ("aksam", "Akşam", "18:00 – 23:00"),
    "dessert": ("tatli", "Tatlı", "Gün boyu"),
}

# İçecek menüsünde yalnızca alkolsüz bölümler uygulamadan sipariş edilebilir.
BEVERAGE_SECTIONS = [
    "KAHVE", "ÇAY", "SOĞUK İÇECEKLER", "SOĞUK DEMLEME ÇAYLAR", "SOĞUK KAHVELER",
    "TAZE MEYVE SUYU", "MEYVELİ MİNERALLI SU", "SAĞLIKLI & TAZE", "MILKSHAKE &", "FROZEN",
    "ALKOLSÜZ KOKTEYL",
]
BEVERAGE_TITLES = {"MILKSHAKE &": "Milkshake & Smoothie", "MEYVELİ MİNERALLI SU": "Meyveli Maden Suyu"}


# "Kahvaltını Zenginleştir" bölümü QR menüde TR/EN ve fiyat tek satırda, düzensiz
# satır kırılımlarıyla yazılmış; güvenilir ayrıştırılamadığı için tablo olarak tutulur.
BREAKFAST_EXTRAS = [
    ("Peynir Tabağı (2 kişilik)", "Cheese Plate for 2", ["MK"], 400),
    ("Peynir Tabağı (4 kişilik)", "Cheese Plate for 4", ["MK"], 750),
    ("Salatalık & Domates (2 kişilik)", "Tomato & Cucumber for 2", [], 150),
    ("Salatalık & Domates (4 kişilik)", "Tomato & Cucumber for 4", [], 280),
    ("Mevsim Reçeli", "Seasonal Jam", [], 80),
    ("Çıtır Kabak ve Tahin", "Crispy Pumpkin & Tahini", [], 200),
    ("Çam Balı", "Pine Honey", [], 100),
    ("Bal & Kaymak", "Honey & Cream", ["MK"], 225),
    ("Tereyağı", "Butter", ["MK"], 150),
    ("Kaymak", "Clotted Cream", ["MK"], 135),
    ("Çikolatalı Fındık Ezmesi", "Chocolate Hazelnut Spread", ["TN"], 75),
    ("Çemen", "Spiced Paste", ["TN"], 75),
    ("Karışık Yeşillik", "Mixed Greens", [], 175),
    ("Avokado", "Avocado", [], 150),
    ("Siyah Zeytin", "Black Olives", [], 75),
    ("Dilme / Kırma Zeytin", "Green Olives", [], 80),
    ("Ege Ezme", "Aegean Spread", ["MK"], 75),
    ("Haşlanmış Yumurta", "Boiled Egg", ["EG"], 60),
    ("Pişi", "Pishi Pastry", ["WH"], 80),
    ("Bazlama", "Flatbread", ["WH"], 150),
    ("Glutensiz Ekmek", "Gluten-free Bread", [], 150),
    ("Simit", "Sesame Bagel", ["WH", "SE", "SP"], 100),
    ("Soslu Biber", "Pepper with Tomato Sauce", [], 75),
    ("Sahine", "Honey, sesame & butter spread", ["MK", "SE"], 75),
]


def slug(s: str) -> str:
    s = s.replace("ı", "i").replace("İ", "i")
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def tr_title(s: str) -> str:
    words = s.strip().replace("I", "ı").replace("İ", "i").lower().split()
    return " ".join(w[:1].upper().replace("i", "İ") + w[1:] if w else w for w in words)


def prices(line: str) -> list[int]:
    out = []
    for p in re.findall(r"[\d.,]+", line):
        p = p.replace(",", "").replace(".", "")
        if p:
            out.append(int(p))
    return out


def clean_name(line: str) -> tuple[str, list[str]]:
    allergens = ALLERGEN_RE.findall(line)
    name = ALLERGEN_RE.sub("", line)
    name = re.sub(r"\s+", " ", name).strip()
    return name, allergens


def drop_block(lines, start_prefix, end_prefix):
    try:
        a = next(i for i, l in enumerate(lines) if l.strip().startswith(start_prefix))
        b = next(i for i, l in enumerate(lines) if i > a and l.strip().startswith(end_prefix))
    except StopIteration:
        return lines
    return lines[:a] + lines[b:]


def is_header(lines, i):
    a = lines[i].strip()
    if a == "VEGAN":
        return True
    if not a or not UPPER_RE.match(a) or len(a) < 3:
        return False
    if a.startswith("14 ALERJEN"):
        return False
    nxt = lines[i + 1].strip() if i + 1 < len(lines) else ""
    return bool(nxt) and UPPER_RE.match(nxt) is not None and not PRICE_LINE_RE.match(nxt)


def parse_food(text: str, service: str):
    lines = [l.rstrip() for l in text.splitlines()]
    # Başlık/şef mesajı kısmını atla: ilk "alerjen uyarısı" İngilizce satırından sonrası
    start = next(i for i, l in enumerate(lines) if l.startswith("The ingredients used")) + 1
    end = next((i for i, l in enumerate(lines) if "14 ALERJEN" in l.upper() or "14 Alerjen" in l), len(lines))
    lines = lines[start:end]
    # Kg fiyatlı günün balığı ve sos seçimi bloklarını çıkar: uygulamada elle tanımlanır (menu.ts)
    lines = drop_block(lines, "Günün Mevsim Balığı", "MERA / KÜMES")
    lines = drop_block(lines, "Tane Karabiber Sosu", "Surf & Turf")
    lines = [l for l in lines if not l.strip().startswith(("Lütfen eşlikçi sos", "Please select a sauce"))]

    sections = []
    cur = None
    buf: list[str] = []
    skip = False
    i = 0
    while i < len(lines):
        l = lines[i].strip()
        if l == "***":
            skip = not skip
            buf = []
            i += 1
            continue
        if skip or not l:
            i += 1
            continue
        if is_header(lines, i):
            buf = []
            single = l == "VEGAN"
            title_en = l if single else lines[i + 1].strip()
            cur = {"id": f"{service}-{slug(l)}", "title": tr_title(l), "titleEn": title_en.title(), "items": []}
            sections.append(cur)
            i += 1 if single else 2
            continue
        if cur is None:
            # Başlıksız menüler (tatlı) için varsayılan bölüm
            cur = {"id": f"{service}-tatlilar", "title": "Tatlılar", "titleEn": "Desserts", "items": []}
            sections.append(cur)
        if PRICE_LINE_RE.match(l) and buf:
            if not buf[0].startswith(("+", "Ev yapımı sos")):
                cur["items"].append(build_item(buf, prices(l), service))
            buf = []
        elif re.search(r"\d+₺\s*$", l) and not buf and " / " not in l:
            # "Peynir Tabağı 2 Cheese Plate (MK) 400₺" tipi tek satırlık ekstralar
            name, allergens = clean_name(re.sub(r"[\d.,]+₺\s*$", "", l))
            cur["items"].append({
                "id": slug(f"{service}-{name}"), "name": name, "allergens": allergens,
                "price": prices(re.findall(r"[\d.,]+₺\s*$", l)[0])[0],
            })
        elif l.startswith(("Not:", "Note:", "Lütfen dikkat", "Please note", "min 2", "Minimum of")):
            pass
        else:
            buf.append(l)
        i += 1
    return [s for s in sections if s["items"]]


def build_item(buf, price_list, service):
    name, allergens = clean_name(re.sub(r"\(GL\)", "(WH)", buf[0]))
    rest = buf[1:]
    extra_allergens = [a for r in rest for a in ALLERGEN_RE.findall(r)]
    rest = [r for r in rest if ALLERGEN_RE.sub("", r).strip()]
    # İngilizce ad yoksa ikinci satır doğrudan TR açıklamadır (virgüllü malzeme listesi)
    name_en = rest.pop(0) if rest and "," not in rest[0] else None
    item = {"id": slug(f"{service}-{name}"), "name": name, "nameEn": name_en,
            "allergens": sorted(set(allergens + extra_allergens))}
    if len(price_list) > 1:
        # Varyantlı ürün: son iki açıklama satırı TR/EN varyant isimleri
        variant_tr = next((r for r in rest if r.count("/") == len(price_list) - 1), None)
        if variant_tr:
            names = [v.strip() for v in variant_tr.split("/")]
        elif name.count("/") == len(price_list) - 1:
            names = [v.strip() for v in name.split("/")]
        else:
            names = [f"Seçenek {k+1}" for k in range(len(price_list))]
        if variant_tr:
            idx = rest.index(variant_tr)
            rest = rest[:idx] + rest[idx + 2:]
        item["options"] = [{"id": slug(n), "name": n, "price": p} for n, p in zip(names, price_list)]
        item["price"] = price_list[0]
    else:
        item["price"] = price_list[0]
    rest = [re.sub(r"\s+", " ", ALLERGEN_RE.sub("", r)).strip() for r in rest]
    if name_en and (len(name_en) > 48 or " - " in name_en):
        # QR menüde İngilizce ad yerine doğrudan İngilizce açıklama yazılmış ürünler
        rest = rest[:1] + [name_en] + rest[1:] if rest else [None, name_en]
        item["nameEn"] = None
    if rest and rest[0]:
        item["description"] = rest[0]
    if len(rest) > 1 and rest[1]:
        item["descriptionEn"] = rest[1]
    return item


def parse_beverages(text: str):
    lines = [l.strip() for l in text.splitlines()]
    sections = []
    cur = None
    active = False
    for idx, l in enumerate(lines):
        if not l:
            continue
        if UPPER_RE.match(l) and len(l) > 2 and "₺" not in l:
            if l in BEVERAGE_SECTIONS:
                active = True
                title = BEVERAGE_TITLES.get(l, tr_title(l))
                cur = {"id": f"icecek-{slug(l)}", "title": title, "items": []}
                sections.append(cur)
            elif l in ("SICAK İÇECEKLER", "HOT BEVERAGES", "SOĞUK İÇECEKLER"):
                pass
            elif active and l not in ("COFFEE", "TEA", "COLD BEVERAGES", "COLD BREW TEA", "COLD COFFEES",
                                      "FRESH JUICE", "SPECIAL SPRING WATER", "HEALTHY & FRESH", "SMOOTHIE",
                                      "NON-ALCOHOLIC COCKTAIL"):
                active = l in BEVERAGE_SECTIONS
            continue
        if not active or cur is None:
            continue
        m = re.match(r"^(.*?)\s*[-–]\s*(₺\s*[\d.,]+(?:\s*/\s*₺\s*[\d.,]+)*)\s*$", l)
        if m:
            name = m.group(1).strip()
            ps = prices(m.group(2))
            item = {"id": slug(f"icecek-{name}"), "name": name, "price": ps[0], "allergens": []}
            if len(ps) > 1:
                item["options"] = [{"id": f"o{k}", "name": n, "price": p} for k, (n, p) in enumerate(zip(["Küçük", "Büyük"], ps))]
            cur["items"].append(item)
        elif cur["items"]:
            last = cur["items"][-1]
            if "nameEn" not in last and not any(c in l for c in ",|("):
                last["nameEn"] = l
            elif "description" not in last:
                last["description"] = l
    return [s for s in sections if s["items"]]


def main():
    src = Path(sys.argv[1])
    menus = []
    for key, (sid, title, hours) in SERVICES.items():
        sections = parse_food((src / f"{key}.txt").read_text(), sid)
        for sec in sections:
            if sec["id"] == "kahvalti-kahvaltini-zenginlestir":
                sec["items"] = [{"id": slug(f"kahvalti-ekstra-{n}"), "name": n, "nameEn": en, "allergens": a, "price": p}
                                for n, en, a, p in BREAKFAST_EXTRAS]
        menus.append({"id": sid, "title": title, "hours": hours, "sections": sections})
    menus.append({"id": "icecek", "title": "İçecek", "hours": "Gün boyu",
                  "sections": parse_beverages((src / "beverages.txt").read_text())})
    json.dump(menus, sys.stdout, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
