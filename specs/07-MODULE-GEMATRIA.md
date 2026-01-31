# Gematria Module

## Overview
Calculate numerical values for the current Hebrew date and weekly Parasha using traditional Hebrew gematria systems.

## Data Points

| Field | Type | Description |
|-------|------|-------------|
| hebrewDate | string | Current Hebrew date |
| dateStandard | number | Standard gematria of date |
| dateOrdinal | number | Ordinal value of date |
| dateReduced | number | Reduced (single digit) value |
| parashaName | string | Current parasha |
| parashaStandard | number | Standard gematria of parasha |
| parashaOrdinal | number | Ordinal value |
| parashaReduced | number | Reduced value |
| dayOfWeek | number | Gematria of Hebrew day name |
| monthName | string | Current Hebrew month |
| monthValue | number | Gematria of month name |

## Gematria Systems

### Standard (Mispar Gadol)
Traditional letter values:

| Letter | Value | Letter | Value | Letter | Value |
|--------|-------|--------|-------|--------|-------|
| א Alef | 1 | י Yod | 10 | ק Qof | 100 |
| ב Bet | 2 | כ Kaf | 20 | ר Resh | 200 |
| ג Gimel | 3 | ל Lamed | 30 | ש Shin | 300 |
| ד Dalet | 4 | מ Mem | 40 | ת Tav | 400 |
| ה He | 5 | נ Nun | 50 | ך Final Kaf | 500 |
| ו Vav | 6 | ס Samech | 60 | ם Final Mem | 600 |
| ז Zayin | 7 | ע Ayin | 70 | ן Final Nun | 700 |
| ח Chet | 8 | פ Pe | 80 | ף Final Pe | 800 |
| ט Tet | 9 | צ Tsade | 90 | ץ Final Tsade | 900 |

### Ordinal (Mispar Siduri)
Letters numbered 1-22 by position in alphabet.

### Reduced (Mispar Katan)
Standard value reduced: 10→1, 20→2, 100→1, 200→2, etc.

## Calculation

```javascript
const STANDARD = {
  'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5,
  'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9, 'י': 10,
  'כ': 20, 'ל': 30, 'מ': 40, 'נ': 50, 'ס': 60,
  'ע': 70, 'פ': 80, 'צ': 90, 'ק': 100, 'ר': 200,
  'ש': 300, 'ת': 400,
  'ך': 500, 'ם': 600, 'ן': 700, 'ף': 800, 'ץ': 900
};

function calculateGematria(hebrewText) {
  return hebrewText
    .split('')
    .filter(c => STANDARD[c])
    .reduce((sum, c) => sum + STANDARD[c], 0);
}

function reduceToSingleDigit(num) {
  while (num > 9) {
    num = String(num).split('').reduce((a, b) => a + parseInt(b), 0);
  }
  return num;
}
```

## Hebrew Date Format

Get from Hebcal API:
```
https://www.hebcal.com/converter?cfg=json&date=2025-01-31&g2h=1
```

Returns:
```json
{
  "hy": 5785,
  "hm": "Shevat",
  "hd": 2,
  "hebrew": "ב׳ שְׁבָט תשפ״ה"
}
```

## Output Example

```json
{
  "hebrewDate": "ב׳ שְׁבָט תשפ״ה",
  "dateComponents": {
    "day": "ב׳",
    "month": "שְׁבָט",
    "year": "תשפ״ה"
  },
  "dateStandard": 787,
  "dateOrdinal": 42,
  "dateReduced": 4,
  "parashaName": "בֹּא",
  "parashaStandard": 3,
  "parashaOrdinal": 3,
  "parashaReduced": 3,
  "dayOfWeek": {
    "hebrew": "יום שישי",
    "value": 346
  },
  "month": {
    "name": "שְׁבָט",
    "value": 311
  }
}
```

## Display

```
🔢 GEMATRIA
─────────────
Date: ב׳ שְׁבָט תשפ״ה
Standard: 787
Reduced: 4

Parasha: בֹּא
Value: 3
```

## Notable Numbers

Consider flagging when values match significant numbers:
- 18 (חי - life)
- 26 (יהוה - Tetragrammaton)
- 72 (שם ע״ב - 72 names)
- 137 (קבלה - Kabbalah)
- 358 (משיח - Messiah)
- 541 (ישראל - Israel)

## Update Frequency
Daily at sunset (when Hebrew date changes) or 00:00 UTC for simplicity
