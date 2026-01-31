# Parashat Hashavua Module

## Overview
The weekly Torah portion read in synagogues on Shabbat. The Torah (Five Books of Moses) is divided into 54 portions, read cyclically over the Jewish year.

## Data Points

| Field | Type | Description |
|-------|------|-------------|
| name | string | Parasha name in Hebrew transliteration |
| nameHebrew | string | Hebrew name (אֵלֶּה שְׁמוֹת) |
| book | string | Torah book (Genesis, Exodus, etc.) |
| bookHebrew | string | Hebrew book name |
| chapters | string | Chapter:verse range |
| reading | string | Brief description of content |
| haftarah | string | Associated prophetic reading |
| shabbatDate | string | Date of the Shabbat |
| isSpecial | boolean | If it's a special Shabbat |
| specialName | string | Name if special (e.g., "Shabbat Shirah") |

## 54 Parashiot

### Bereishit (Genesis)
1. Bereishit, 2. Noach, 3. Lech Lecha, 4. Vayera, 5. Chayei Sarah, 6. Toldot, 7. Vayetze, 8. Vayishlach, 9. Vayeshev, 10. Miketz, 11. Vayigash, 12. Vayechi

### Shemot (Exodus)
13. Shemot, 14. Va'era, 15. Bo, 16. Beshalach, 17. Yitro, 18. Mishpatim, 19. Terumah, 20. Tetzaveh, 21. Ki Tisa, 22. Vayakhel, 23. Pekudei

### Vayikra (Leviticus)
24. Vayikra, 25. Tzav, 26. Shemini, 27. Tazria, 28. Metzora, 29. Acharei Mot, 30. Kedoshim, 31. Emor, 32. Behar, 33. Bechukotai

### Bamidbar (Numbers)
34. Bamidbar, 35. Naso, 36. Beha'alotcha, 37. Shelach, 38. Korach, 39. Chukat, 40. Balak, 41. Pinchas, 42. Matot, 43. Masei

### Devarim (Deuteronomy)
44. Devarim, 45. Va'etchanan, 46. Eikev, 47. Re'eh, 48. Shoftim, 49. Ki Teitzei, 50. Ki Tavo, 51. Nitzavim, 52. Vayeilech, 53. Ha'azinu, 54. V'Zot HaBerachah

## Data Source

**Hebcal API** (free, no auth required):
```
https://www.hebcal.com/shabbat?cfg=json&geonameid=293397
```

Parameters:
- `cfg=json` - JSON format
- `geonameid=293397` - Jerusalem (for candle lighting times)
- Or use `zip=10001` for US locations

Response includes:
- Parasha name
- Candle lighting time
- Havdalah time
- Hebrew date

## Output Example

```json
{
  "name": "Bo",
  "nameHebrew": "בֹּא",
  "book": "Exodus",
  "bookHebrew": "שְׁמוֹת",
  "chapters": "10:1-13:16",
  "reading": "Final three plagues; commandment of Passover",
  "haftarah": "Jeremiah 46:13-28",
  "shabbatDate": "2025-02-01",
  "hebrewDate": "3 Shevat 5785",
  "isSpecial": false,
  "specialName": null
}
```

## Display

```
📜 PARASHA
─────────────
Bo בֹּא
Exodus 10:1-13:16
Shabbat: Feb 1
3 Shevat 5785
```

## Update Frequency
Weekly - update after Saturday sunset (when new week begins in Jewish calendar)

## Special Shabbatot

Handle these special readings that occur on specific weeks:
- Shabbat Shekalim
- Shabbat Zachor
- Shabbat Parah
- Shabbat HaChodesh
- Shabbat HaGadol
- Shabbat Shirah
- Shabbat Chazon
- Shabbat Nachamu
