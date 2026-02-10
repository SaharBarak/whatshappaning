const { validatePreferences, VALID_INTERESTS, VALID_TIME_PREFS } = (() => {
  // Extract validation logic for unit testing
  const VALID_INTERESTS = [
    'astrology', 'moon', 'numerology', 'tarot', 'iching',
    'markets', 'geophysical', 'solar', 'schumann', 'sentiment',
    'cosmic', 'gematria', 'parasha', 'tzolkin', 'dreamspell', 'news'
  ];
  const VALID_TIME_PREFS = ['morning', 'afternoon', 'evening', 'night', 'all'];

  function validatePreferences(body) {
    const errors = [];
    if (body.interests !== undefined) {
      if (!Array.isArray(body.interests)) {
        errors.push('interests must be an array');
      } else {
        const invalid = body.interests.filter(i => !VALID_INTERESTS.includes(i));
        if (invalid.length) errors.push(`Invalid interests: ${invalid.join(', ')}`);
      }
    }
    if (body.locationRadius !== undefined) {
      const r = Number(body.locationRadius);
      if (isNaN(r) || r < 1 || r > 500) errors.push('locationRadius must be 1-500 km');
    }
    if (body.preferredTimes !== undefined) {
      if (!Array.isArray(body.preferredTimes)) {
        errors.push('preferredTimes must be an array');
      } else {
        const invalid = body.preferredTimes.filter(t => !VALID_TIME_PREFS.includes(t));
        if (invalid.length) errors.push(`Invalid time preferences: ${invalid.join(', ')}`);
      }
    }
    return errors;
  }

  return { validatePreferences, VALID_INTERESTS, VALID_TIME_PREFS };
})();

describe('Preferences Validation', () => {
  test('accepts valid interests', () => {
    const errors = validatePreferences({ interests: ['astrology', 'markets', 'news'] });
    expect(errors).toHaveLength(0);
  });

  test('rejects invalid interests', () => {
    const errors = validatePreferences({ interests: ['astrology', 'fake_category'] });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('fake_category');
  });

  test('rejects non-array interests', () => {
    const errors = validatePreferences({ interests: 'astrology' });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toBe('interests must be an array');
  });

  test('accepts valid locationRadius', () => {
    expect(validatePreferences({ locationRadius: 50 })).toHaveLength(0);
    expect(validatePreferences({ locationRadius: 1 })).toHaveLength(0);
    expect(validatePreferences({ locationRadius: 500 })).toHaveLength(0);
  });

  test('rejects invalid locationRadius', () => {
    expect(validatePreferences({ locationRadius: 0 })).toHaveLength(1);
    expect(validatePreferences({ locationRadius: 501 })).toHaveLength(1);
    expect(validatePreferences({ locationRadius: 'abc' })).toHaveLength(1);
  });

  test('accepts valid time preferences', () => {
    const errors = validatePreferences({ preferredTimes: ['morning', 'evening'] });
    expect(errors).toHaveLength(0);
  });

  test('rejects invalid time preferences', () => {
    const errors = validatePreferences({ preferredTimes: ['morning', 'midnight'] });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('midnight');
  });

  test('accepts empty body', () => {
    expect(validatePreferences({})).toHaveLength(0);
  });

  test('accumulates multiple errors', () => {
    const errors = validatePreferences({
      interests: 'not-array',
      locationRadius: -1,
      preferredTimes: 'not-array',
    });
    expect(errors).toHaveLength(3);
  });
});
