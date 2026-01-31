/**
 * Parasha Module - Weekly Torah Portion
 *
 * Fetches the current week's Torah portion (parasha) from the Hebcal API.
 * Includes Shabbat times, Hebrew date, and special Shabbat designations.
 *
 * Primary data source: Hebcal API (free, no authentication required)
 * Update frequency: Weekly on Friday at 18:00 UTC
 */

const axios = require('axios');

// Hebcal API endpoints
const HEBCAL_SHABBAT_URL = 'https://www.hebcal.com/shabbat';
const DEFAULT_GEONAMEID = '293397'; // Jerusalem

/**
 * Complete list of 54 parashiot with metadata
 * Used as fallback when Hebcal API is unavailable
 */
const PARASHIOT = [
  // Genesis / Bereishit (12 parashiot)
  { index: 1, name: 'Bereishit', nameHebrew: 'בְּרֵאשִׁית', book: 'Genesis', bookHebrew: 'בְּרֵאשִׁית', chapters: '1:1-6:8', reading: 'Creation of the world; Adam and Eve; Cain and Abel' },
  { index: 2, name: 'Noach', nameHebrew: 'נֹחַ', book: 'Genesis', bookHebrew: 'בְּרֵאשִׁית', chapters: '6:9-11:32', reading: 'The Flood; Tower of Babel' },
  { index: 3, name: 'Lech-Lecha', nameHebrew: 'לֶךְ־לְךָ', book: 'Genesis', bookHebrew: 'בְּרֵאשִׁית', chapters: '12:1-17:27', reading: 'God calls Abram; covenant of circumcision' },
  { index: 4, name: 'Vayera', nameHebrew: 'וַיֵּרָא', book: 'Genesis', bookHebrew: 'בְּרֵאשִׁית', chapters: '18:1-22:24', reading: 'Three visitors; Sodom and Gomorrah; Binding of Isaac' },
  { index: 5, name: 'Chayei Sara', nameHebrew: 'חַיֵּי שָׂרָה', book: 'Genesis', bookHebrew: 'בְּרֵאשִׁית', chapters: '23:1-25:18', reading: 'Death of Sarah; finding a wife for Isaac' },
  { index: 6, name: 'Toldot', nameHebrew: 'תּוֹלְדֹת', book: 'Genesis', bookHebrew: 'בְּרֵאשִׁית', chapters: '25:19-28:9', reading: 'Jacob and Esau; stolen blessing' },
  { index: 7, name: 'Vayetzei', nameHebrew: 'וַיֵּצֵא', book: 'Genesis', bookHebrew: 'בְּרֵאשִׁית', chapters: '28:10-32:3', reading: 'Jacob\'s ladder; marriage to Leah and Rachel' },
  { index: 8, name: 'Vayishlach', nameHebrew: 'וַיִּשְׁלַח', book: 'Genesis', bookHebrew: 'בְּרֵאשִׁית', chapters: '32:4-36:43', reading: 'Wrestling with the angel; reunion with Esau' },
  { index: 9, name: 'Vayeshev', nameHebrew: 'וַיֵּשֶׁב', book: 'Genesis', bookHebrew: 'בְּרֵאשִׁית', chapters: '37:1-40:23', reading: 'Joseph\'s dreams; sold into slavery; Potiphar\'s wife' },
  { index: 10, name: 'Miketz', nameHebrew: 'מִקֵּץ', book: 'Genesis', bookHebrew: 'בְּרֵאשִׁית', chapters: '41:1-44:17', reading: 'Pharaoh\'s dreams; Joseph as viceroy' },
  { index: 11, name: 'Vayigash', nameHebrew: 'וַיִּגַּשׁ', book: 'Genesis', bookHebrew: 'בְּרֵאשִׁית', chapters: '44:18-47:27', reading: 'Judah\'s plea; Joseph reveals himself' },
  { index: 12, name: 'Vayechi', nameHebrew: 'וַיְחִי', book: 'Genesis', bookHebrew: 'בְּרֵאשִׁית', chapters: '47:28-50:26', reading: 'Jacob blesses his sons; death of Jacob and Joseph' },

  // Exodus / Shemot (11 parashiot)
  { index: 13, name: 'Shemot', nameHebrew: 'שְׁמוֹת', book: 'Exodus', bookHebrew: 'שְׁמוֹת', chapters: '1:1-6:1', reading: 'Slavery in Egypt; Moses at the burning bush' },
  { index: 14, name: 'Vaera', nameHebrew: 'וָאֵרָא', book: 'Exodus', bookHebrew: 'שְׁמוֹת', chapters: '6:2-9:35', reading: 'First seven plagues' },
  { index: 15, name: 'Bo', nameHebrew: 'בֹּא', book: 'Exodus', bookHebrew: 'שְׁמוֹת', chapters: '10:1-13:16', reading: 'Final three plagues; commandment of Passover' },
  { index: 16, name: 'Beshalach', nameHebrew: 'בְּשַׁלַּח', book: 'Exodus', bookHebrew: 'שְׁמוֹת', chapters: '13:17-17:16', reading: 'Splitting of the sea; manna from heaven' },
  { index: 17, name: 'Yitro', nameHebrew: 'יִתְרוֹ', book: 'Exodus', bookHebrew: 'שְׁמוֹת', chapters: '18:1-20:23', reading: 'Giving of the Torah at Sinai; Ten Commandments' },
  { index: 18, name: 'Mishpatim', nameHebrew: 'מִשְׁפָּטִים', book: 'Exodus', bookHebrew: 'שְׁמוֹת', chapters: '21:1-24:18', reading: 'Civil laws; covenant ceremony' },
  { index: 19, name: 'Terumah', nameHebrew: 'תְּרוּמָה', book: 'Exodus', bookHebrew: 'שְׁמוֹת', chapters: '25:1-27:19', reading: 'Instructions for the Tabernacle' },
  { index: 20, name: 'Tetzaveh', nameHebrew: 'תְּצַוֶּה', book: 'Exodus', bookHebrew: 'שְׁמוֹת', chapters: '27:20-30:10', reading: 'Priestly garments; consecration of priests' },
  { index: 21, name: 'Ki Tisa', nameHebrew: 'כִּי תִשָּׂא', book: 'Exodus', bookHebrew: 'שְׁמוֹת', chapters: '30:11-34:35', reading: 'Golden calf; Moses breaks the tablets' },
  { index: 22, name: 'Vayakhel', nameHebrew: 'וַיַּקְהֵל', book: 'Exodus', bookHebrew: 'שְׁמוֹת', chapters: '35:1-38:20', reading: 'Building of the Tabernacle' },
  { index: 23, name: 'Pekudei', nameHebrew: 'פְקוּדֵי', book: 'Exodus', bookHebrew: 'שְׁמוֹת', chapters: '38:21-40:38', reading: 'Accounting of Tabernacle materials; completion' },

  // Leviticus / Vayikra (10 parashiot)
  { index: 24, name: 'Vayikra', nameHebrew: 'וַיִּקְרָא', book: 'Leviticus', bookHebrew: 'וַיִּקְרָא', chapters: '1:1-5:26', reading: 'Laws of sacrifices' },
  { index: 25, name: 'Tzav', nameHebrew: 'צַו', book: 'Leviticus', bookHebrew: 'וַיִּקְרָא', chapters: '6:1-8:36', reading: 'Priestly duties; inauguration of the Tabernacle' },
  { index: 26, name: 'Shemini', nameHebrew: 'שְּׁמִינִי', book: 'Leviticus', bookHebrew: 'וַיִּקְרָא', chapters: '9:1-11:47', reading: 'Death of Nadab and Abihu; kosher laws' },
  { index: 27, name: 'Tazria', nameHebrew: 'תַזְרִיעַ', book: 'Leviticus', bookHebrew: 'וַיִּקְרָא', chapters: '12:1-13:59', reading: 'Childbirth; laws of tzaraat (skin afflictions)' },
  { index: 28, name: 'Metzora', nameHebrew: 'מְּצֹרָע', book: 'Leviticus', bookHebrew: 'וַיִּקְרָא', chapters: '14:1-15:33', reading: 'Purification from tzaraat; ritual impurity' },
  { index: 29, name: 'Achrei Mot', nameHebrew: 'אַחֲרֵי מוֹת', book: 'Leviticus', bookHebrew: 'וַיִּקְרָא', chapters: '16:1-18:30', reading: 'Yom Kippur service; forbidden relationships' },
  { index: 30, name: 'Kedoshim', nameHebrew: 'קְדֹשִׁים', book: 'Leviticus', bookHebrew: 'וַיִּקְרָא', chapters: '19:1-20:27', reading: 'Holiness code; love your neighbor' },
  { index: 31, name: 'Emor', nameHebrew: 'אֱמֹר', book: 'Leviticus', bookHebrew: 'וַיִּקְרָא', chapters: '21:1-24:23', reading: 'Priestly laws; holidays' },
  { index: 32, name: 'Behar', nameHebrew: 'בְּהַר', book: 'Leviticus', bookHebrew: 'וַיִּקְרָא', chapters: '25:1-26:2', reading: 'Sabbatical year; Jubilee' },
  { index: 33, name: 'Bechukotai', nameHebrew: 'בְּחֻקֹּתַי', book: 'Leviticus', bookHebrew: 'וַיִּקְרָא', chapters: '26:3-27:34', reading: 'Blessings and curses; valuations' },

  // Numbers / Bamidbar (10 parashiot)
  { index: 34, name: 'Bamidbar', nameHebrew: 'בְּמִדְבַּר', book: 'Numbers', bookHebrew: 'בְּמִדְבַּר', chapters: '1:1-4:20', reading: 'Census of the Israelites; camp arrangement' },
  { index: 35, name: 'Naso', nameHebrew: 'נָשֹׂא', book: 'Numbers', bookHebrew: 'בְּמִדְבַּר', chapters: '4:21-7:89', reading: 'Sotah; Nazir; Priestly blessing' },
  { index: 36, name: 'Behaalotcha', nameHebrew: 'בְּהַעֲלֹתְךָ', book: 'Numbers', bookHebrew: 'בְּמִדְבַּר', chapters: '8:1-12:16', reading: 'Menorah; second Passover; Miriam\'s leprosy' },
  { index: 37, name: 'Shelach', nameHebrew: 'שְׁלַח', book: 'Numbers', bookHebrew: 'בְּמִדְבַּר', chapters: '13:1-15:41', reading: 'The spies; 40 years in the desert; tzitzit' },
  { index: 38, name: 'Korach', nameHebrew: 'קֹרַח', book: 'Numbers', bookHebrew: 'בְּמִדְבַּר', chapters: '16:1-18:32', reading: 'Korach\'s rebellion; Aaron\'s staff' },
  { index: 39, name: 'Chukat', nameHebrew: 'חֻקַּת', book: 'Numbers', bookHebrew: 'בְּמִדְבַּר', chapters: '19:1-22:1', reading: 'Red heifer; death of Miriam and Aaron; bronze serpent' },
  { index: 40, name: 'Balak', nameHebrew: 'בָּלָק', book: 'Numbers', bookHebrew: 'בְּמִדְבַּר', chapters: '22:2-25:9', reading: 'Balaam and his donkey; blessings instead of curses' },
  { index: 41, name: 'Pinchas', nameHebrew: 'פִּינְחָס', book: 'Numbers', bookHebrew: 'בְּמִדְבַּר', chapters: '25:10-30:1', reading: 'Pinchas\'s reward; daughters of Zelophehad; daily offerings' },
  { index: 42, name: 'Matot', nameHebrew: 'מַּטּוֹת', book: 'Numbers', bookHebrew: 'בְּמִדְבַּר', chapters: '30:2-32:42', reading: 'Vows; war against Midian; tribes settle east of Jordan' },
  { index: 43, name: 'Masei', nameHebrew: 'מַסְעֵי', book: 'Numbers', bookHebrew: 'בְּמִדְבַּר', chapters: '33:1-36:13', reading: 'Journey recounted; borders of the land; cities of refuge' },

  // Deuteronomy / Devarim (11 parashiot)
  { index: 44, name: 'Devarim', nameHebrew: 'דְּבָרִים', book: 'Deuteronomy', bookHebrew: 'דְּבָרִים', chapters: '1:1-3:22', reading: 'Moses recounts the journey; appointment of judges' },
  { index: 45, name: 'Vaetchanan', nameHebrew: 'וָאֶתְחַנַּן', book: 'Deuteronomy', bookHebrew: 'דְּבָרִים', chapters: '3:23-7:11', reading: 'Shema; Ten Commandments repeated' },
  { index: 46, name: 'Eikev', nameHebrew: 'עֵקֶב', book: 'Deuteronomy', bookHebrew: 'דְּבָרִים', chapters: '7:12-11:25', reading: 'Blessings for obedience; second tablets' },
  { index: 47, name: 'Re\'eh', nameHebrew: 'רְאֵה', book: 'Deuteronomy', bookHebrew: 'דְּבָרִים', chapters: '11:26-16:17', reading: 'Blessing and curse; centralized worship; holidays' },
  { index: 48, name: 'Shoftim', nameHebrew: 'שֹׁפְטִים', book: 'Deuteronomy', bookHebrew: 'דְּבָרִים', chapters: '16:18-21:9', reading: 'Justice system; laws of warfare; cities of refuge' },
  { index: 49, name: 'Ki Teitzei', nameHebrew: 'כִּי־תֵצֵא', book: 'Deuteronomy', bookHebrew: 'דְּבָרִים', chapters: '21:10-25:19', reading: '74 commandments; family law; honest weights' },
  { index: 50, name: 'Ki Tavo', nameHebrew: 'כִּי־תָבוֹא', book: 'Deuteronomy', bookHebrew: 'דְּבָרִים', chapters: '26:1-29:8', reading: 'First fruits; blessings and curses at Ebal and Gerizim' },
  { index: 51, name: 'Nitzavim', nameHebrew: 'נִצָּבִים', book: 'Deuteronomy', bookHebrew: 'דְּבָרִים', chapters: '29:9-30:20', reading: 'Covenant renewed; choose life' },
  { index: 52, name: 'Vayeilech', nameHebrew: 'וַיֵּלֶךְ', book: 'Deuteronomy', bookHebrew: 'דְּבָרִים', chapters: '31:1-31:30', reading: 'Moses\'s final day; Hakhel; Torah given to Levites' },
  { index: 53, name: 'Haazinu', nameHebrew: 'הַאֲזִינוּ', book: 'Deuteronomy', bookHebrew: 'דְּבָרִים', chapters: '32:1-32:52', reading: 'Moses\'s song; commanded to ascend Mount Nebo' },
  { index: 54, name: 'Vezot Haberakhah', nameHebrew: 'וְזֹאת הַבְּרָכָה', book: 'Deuteronomy', bookHebrew: 'דְּבָרִים', chapters: '33:1-34:12', reading: 'Moses blesses the tribes; death of Moses' },
];

/**
 * Haftarah mappings for regular parashiot
 */
const HAFTAROT = {
  'Bereishit': 'Isaiah 42:5-43:10',
  'Noach': 'Isaiah 54:1-55:5',
  'Lech-Lecha': 'Isaiah 40:27-41:16',
  'Vayera': 'II Kings 4:1-37',
  'Chayei Sara': 'I Kings 1:1-31',
  'Toldot': 'Malachi 1:1-2:7',
  'Vayetzei': 'Hosea 12:13-14:10',
  'Vayishlach': 'Obadiah 1:1-21',
  'Vayeshev': 'Amos 2:6-3:8',
  'Miketz': 'I Kings 3:15-4:1',
  'Vayigash': 'Ezekiel 37:15-28',
  'Vayechi': 'I Kings 2:1-12',
  'Shemot': 'Isaiah 27:6-28:13; 29:22-23',
  'Vaera': 'Ezekiel 28:25-29:21',
  'Bo': 'Jeremiah 46:13-28',
  'Beshalach': 'Judges 4:4-5:31',
  'Yitro': 'Isaiah 6:1-7:6; 9:5-6',
  'Mishpatim': 'Jeremiah 34:8-22; 33:25-26',
  'Terumah': 'I Kings 5:26-6:13',
  'Tetzaveh': 'Ezekiel 43:10-27',
  'Ki Tisa': 'I Kings 18:1-39',
  'Vayakhel': 'I Kings 7:40-50',
  'Pekudei': 'I Kings 7:51-8:21',
  'Vayikra': 'Isaiah 43:21-44:23',
  'Tzav': 'Jeremiah 7:21-8:3; 9:22-23',
  'Shemini': 'II Samuel 6:1-7:17',
  'Tazria': 'II Kings 4:42-5:19',
  'Metzora': 'II Kings 7:3-20',
  'Achrei Mot': 'Ezekiel 22:1-19',
  'Kedoshim': 'Amos 9:7-15',
  'Emor': 'Ezekiel 44:15-31',
  'Behar': 'Jeremiah 32:6-27',
  'Bechukotai': 'Jeremiah 16:19-17:14',
  'Bamidbar': 'Hosea 2:1-22',
  'Naso': 'Judges 13:2-25',
  'Behaalotcha': 'Zechariah 2:14-4:7',
  'Shelach': 'Joshua 2:1-24',
  'Korach': 'I Samuel 11:14-12:22',
  'Chukat': 'Judges 11:1-33',
  'Balak': 'Micah 5:6-6:8',
  'Pinchas': 'I Kings 18:46-19:21',
  'Matot': 'Jeremiah 1:1-2:3',
  'Masei': 'Jeremiah 2:4-28; 3:4',
  'Devarim': 'Isaiah 1:1-27',
  'Vaetchanan': 'Isaiah 40:1-26',
  'Eikev': 'Isaiah 49:14-51:3',
  'Re\'eh': 'Isaiah 54:11-55:5',
  'Shoftim': 'Isaiah 51:12-52:12',
  'Ki Teitzei': 'Isaiah 54:1-10',
  'Ki Tavo': 'Isaiah 60:1-22',
  'Nitzavim': 'Isaiah 61:10-63:9',
  'Vayeilech': 'Isaiah 55:6-56:8',
  'Haazinu': 'II Samuel 22:1-51',
  'Vezot Haberakhah': 'Joshua 1:1-18',
};

/**
 * Special Shabbatot with their characteristics
 */
const SPECIAL_SHABBATOT = {
  'Shabbat Shekalim': {
    description: 'First of four special Shabbatot before Passover',
    timing: 'Before or on Rosh Chodesh Adar (Adar II in leap years)',
    specialReading: 'Exodus 30:11-16',
    specialHaftarah: 'II Kings 12:1-17',
  },
  'Shabbat Zachor': {
    description: 'Remember Amalek - Shabbat before Purim',
    timing: 'Shabbat before Purim',
    specialReading: 'Deuteronomy 25:17-19',
    specialHaftarah: 'I Samuel 15:2-34',
  },
  'Shabbat Parah': {
    description: 'Red Heifer - purification before Passover',
    timing: 'Shabbat before Shabbat HaChodesh',
    specialReading: 'Numbers 19:1-22',
    specialHaftarah: 'Ezekiel 36:16-38',
  },
  'Shabbat HaChodesh': {
    description: 'The month of Nisan is announced',
    timing: 'Shabbat before or on Rosh Chodesh Nisan',
    specialReading: 'Exodus 12:1-20',
    specialHaftarah: 'Ezekiel 45:16-46:18',
  },
  'Shabbat HaGadol': {
    description: 'The Great Shabbat before Passover',
    timing: 'Shabbat before Passover',
    specialHaftarah: 'Malachi 3:4-24',
  },
  'Shabbat Shirah': {
    description: 'Shabbat of Song - Song at the Sea',
    timing: 'Shabbat when Beshalach is read',
    note: 'Parasha Beshalach contains the Song at the Sea',
  },
  'Shabbat Chazon': {
    description: 'Shabbat of Vision - before Tisha B\'Av',
    timing: 'Shabbat before Tisha B\'Av',
    specialHaftarah: 'Isaiah 1:1-27',
  },
  'Shabbat Nachamu': {
    description: 'Shabbat of Comfort - after Tisha B\'Av',
    timing: 'Shabbat after Tisha B\'Av',
    specialHaftarah: 'Isaiah 40:1-26',
  },
};

/**
 * Fetch Shabbat data from Hebcal API
 * @param {Object} options - API options
 * @returns {Promise<Object>} API response
 */
async function fetchFromHebcal(options = {}) {
  const params = new URLSearchParams({
    cfg: 'json',
    geonameid: options.geonameid || DEFAULT_GEONAMEID,
    M: 'on', // Include Havdalah
    b: '18', // Candle lighting minutes before sunset (default)
  });

  // Allow ZIP code override for US locations
  if (options.zip) {
    params.delete('geonameid');
    params.set('zip', options.zip);
  }

  const url = `${HEBCAL_SHABBAT_URL}?${params.toString()}`;

  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'WhatsHappening/1.0 (https://github.com/whats-happening)',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Hebcal API error:', error.message);
    throw error;
  }
}

/**
 * Parse Hebcal API response into parasha data
 * @param {Object} apiResponse - Raw API response
 * @returns {Object} Parsed parasha data
 */
function parseHebcalResponse(apiResponse) {
  const items = apiResponse.items || [];

  let parashaName = null;
  let parashaHebrew = null;
  let candleLighting = null;
  let havdalah = null;
  let shabbatDate = null;
  let hebrewDate = null;
  let isSpecial = false;
  let specialName = null;

  for (const item of items) {
    switch (item.category) {
      case 'parashat':
        parashaName = item.title.replace('Parashat ', '');
        parashaHebrew = item.hebrew || null;
        shabbatDate = item.date;
        break;
      case 'candles':
        candleLighting = item.title.replace('Candle lighting: ', '');
        break;
      case 'havdalah':
        havdalah = item.title.replace('Havdalah: ', '');
        break;
      case 'hebdate':
        if (item.date === shabbatDate || !hebrewDate) {
          hebrewDate = item.hebrew || item.title;
        }
        break;
      case 'holiday':
        // Check for special Shabbatot
        const specialMatch = Object.keys(SPECIAL_SHABBATOT).find(
          name => item.title.includes(name) || item.title.includes(name.replace('Shabbat ', ''))
        );
        if (specialMatch) {
          isSpecial = true;
          specialName = specialMatch;
        }
        break;
    }
  }

  // Find parasha metadata from our static list
  const parashaData = findParashaByName(parashaName);

  // Handle double parashiot (e.g., "Vayakhel-Pekudei")
  let chapters = parashaData?.chapters;
  let reading = parashaData?.reading;
  let book = parashaData?.book;
  let bookHebrew = parashaData?.bookHebrew;

  if (parashaName && parashaName.includes('-')) {
    const parts = parashaName.split('-');
    const first = findParashaByName(parts[0]);
    const second = findParashaByName(parts[1]);

    if (first && second) {
      book = first.book;
      bookHebrew = first.bookHebrew;
      chapters = `${first.chapters.split('-')[0]}-${second.chapters.split('-')[1]}`;
      reading = `${first.reading}; ${second.reading}`;
    }
  }

  // Get haftarah
  let haftarah = HAFTAROT[parashaName] || null;
  if (isSpecial && specialName && SPECIAL_SHABBATOT[specialName]?.specialHaftarah) {
    haftarah = SPECIAL_SHABBATOT[specialName].specialHaftarah;
  }

  const hebrewName = parashaHebrew || parashaData?.nameHebrew || null;

  return {
    name: parashaName,
    nameHebrew: hebrewName,
    // Aliases for gematria module compatibility
    hebrewName: hebrewName,
    englishName: parashaName,
    book: book || null,
    bookHebrew: bookHebrew || null,
    chapters: chapters || null,
    reading: reading || null,
    haftarah,
    shabbatDate: shabbatDate || null,
    hebrewDate: hebrewDate || null,
    candleLighting: candleLighting || null,
    havdalah: havdalah || null,
    isSpecial,
    specialName,
  };
}

/**
 * Find parasha by name (handles variations in spelling)
 * @param {string} name - Parasha name
 * @returns {Object|null} Parasha data or null
 */
function findParashaByName(name) {
  if (!name) return null;

  // Normalize name for comparison
  const normalized = name.toLowerCase()
    .replace(/['-]/g, '')
    .replace(/\s+/g, '');

  return PARASHIOT.find(p => {
    const pNormalized = p.name.toLowerCase()
      .replace(/['-]/g, '')
      .replace(/\s+/g, '');
    return pNormalized === normalized || p.name === name;
  });
}

/**
 * Calculate the parasha index for a given date using a simplified cycle
 * This is a fallback when the API is unavailable
 * @param {Date} date - JavaScript Date
 * @returns {number} Parasha index (0-53)
 */
function calculateParashaIndex(date) {
  // This is a simplified calculation based on the week of the year
  // In reality, the parasha cycle is synchronized with the Jewish calendar
  // and certain parashiot are combined in non-leap years

  // Reference: Simchat Torah 5784 was October 7, 2023
  // That's when we start reading Bereishit
  const simchatTorah5784 = new Date('2023-10-07');
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;

  const weeksSinceSimchatTorah = Math.floor(
    (date.getTime() - simchatTorah5784.getTime()) / msPerWeek
  );

  // Handle the yearly cycle (approximately 52-54 weeks)
  // Use modulo to cycle through the parashiot
  const index = ((weeksSinceSimchatTorah % 54) + 54) % 54;

  return index;
}

/**
 * Get the next Shabbat date from a given date
 * @param {Date} date - Starting date
 * @returns {Date} Next Shabbat (Saturday)
 */
function getNextShabbat(date) {
  const result = new Date(date);
  const dayOfWeek = result.getUTCDay();

  // If it's Saturday, return this Saturday
  if (dayOfWeek === 6) {
    return result;
  }

  // Otherwise, find next Saturday
  const daysUntilShabbat = (6 - dayOfWeek + 7) % 7 || 7;
  result.setUTCDate(result.getUTCDate() + daysUntilShabbat);
  return result;
}

/**
 * Calculate parasha data for a given date
 * Used by gematria module and as fallback
 * @param {Date} date - JavaScript Date (defaults to now)
 * @returns {Promise<Object>} Parasha data
 */
async function calculate(date = new Date()) {
  try {
    // Try Hebcal API first
    const apiResponse = await fetchFromHebcal();
    const parsed = parseHebcalResponse(apiResponse);

    if (parsed.name) {
      return {
        ...parsed,
        source: 'hebcal',
        calculatedAt: new Date().toISOString(),
      };
    }
  } catch (error) {
    console.warn('Hebcal API unavailable, using fallback calculation:', error.message);
  }

  // Fallback to static calculation
  return calculateFallback(date);
}

/**
 * Fallback calculation using static data
 * @param {Date} date - JavaScript Date
 * @returns {Object} Parasha data
 */
function calculateFallback(date) {
  const shabbatDate = getNextShabbat(date);
  const index = calculateParashaIndex(shabbatDate);
  const parasha = PARASHIOT[index];

  return {
    name: parasha.name,
    nameHebrew: parasha.nameHebrew,
    // Aliases for gematria module compatibility
    hebrewName: parasha.nameHebrew,
    englishName: parasha.name,
    book: parasha.book,
    bookHebrew: parasha.bookHebrew,
    chapters: parasha.chapters,
    reading: parasha.reading,
    haftarah: HAFTAROT[parasha.name] || null,
    shabbatDate: shabbatDate.toISOString().split('T')[0],
    hebrewDate: null, // Not available in fallback
    candleLighting: null, // Not available in fallback
    havdalah: null, // Not available in fallback
    isSpecial: false,
    specialName: null,
    source: 'fallback',
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Get parasha for a specific date
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {Promise<Object>} Parasha data
 */
async function getForDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00Z');
  return calculate(date);
}

/**
 * Get all parashiot (static data)
 * @returns {Array} All 54 parashiot
 */
function getAllParashiot() {
  return PARASHIOT.map(p => ({
    ...p,
    haftarah: HAFTAROT[p.name] || null,
  }));
}

/**
 * Get special Shabbatot information
 * @returns {Object} Special Shabbatot data
 */
function getSpecialShabbatot() {
  return SPECIAL_SHABBATOT;
}

/**
 * Module collect function for scheduler
 * @returns {Promise<Object>} Collected parasha data
 */
async function collect() {
  const now = new Date();
  const parashaData = await calculate(now);

  return {
    ...parashaData,
    collectedAt: now.toISOString(),
  };
}

module.exports = {
  name: 'parasha',
  schedule: '0 18 * * 5', // Weekly on Friday at 18:00 UTC
  collect,
  calculate,
  getForDate,
  getAllParashiot,
  getSpecialShabbatot,
  findParashaByName,
  // Export static data for reference
  PARASHIOT,
  HAFTAROT,
  SPECIAL_SHABBATOT,
};
