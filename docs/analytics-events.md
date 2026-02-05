# WhatsHappening Analytics Events Documentation

This document describes all Google Analytics 4 (GA4) events tracked across the WhatsHappening site.

## Event Categories

### Page Views & Navigation
| Event Name | Description | Parameters |
|------------|-------------|------------|
| `page_view` | Page load/navigation | `page_path`, `page_title`, `page_location` |
| `navigation_click` | Navigation link clicked | `link_text`, `link_url`, `nav_section` |
| `external_link` | External link clicked | `link_url`, `link_domain` |
| `back_to_top` | Back to top button clicked | `scroll_depth` |

### User Interactions
| Event Name | Description | Parameters |
|------------|-------------|------------|
| `module_expand` | Data module expanded | `module_id`, `module_name` |
| `module_collapse` | Data module collapsed | `module_id`, `module_name` |
| `prediction_click` | Prediction item clicked | `prediction_id`, `outcome_type`, `confidence` |
| `alert_dismiss` | Pattern alert dismissed | `alert_id`, `alert_type` |
| `theme_change` | Theme toggled | `from_theme`, `to_theme` |
| `language_change` | Language changed | `from_lang`, `to_lang` |

### Content Engagement
| Event Name | Description | Parameters |
|------------|-------------|------------|
| `scroll_depth` | Scroll milestone reached (25%, 50%, 75%, 90%, 100%) | `percent_scrolled`, `pixel_depth` |
| `time_on_page` | Time milestone reached (30s, 60s, 180s, 300s, 600s) | `seconds_elapsed`, `page_path` |
| `content_visibility` | Section becomes visible | `section_id`, `visibility_time` |
| `chart_interaction` | User interacts with chart | `chart_id`, `interaction_type` |

### Form Submissions
| Event Name | Description | Parameters |
|------------|-------------|------------|
| `form_start` | User starts filling form | `form_id`, `form_name` |
| `form_submit` | Form submitted | `form_id`, `form_name`, `success` |
| `email_signup` | Email subscription | `signup_source`, `preferences` |
| `email_signup_error` | Signup failed | `error_type`, `error_message` |

### Feature Usage
| Event Name | Description | Parameters |
|------------|-------------|------------|
| `share_click` | Share button clicked | `share_platform`, `content_type` |
| `share_complete` | Share completed | `share_platform`, `content_type` |
| `export_data` | Data export initiated | `export_format`, `content_type` |
| `notification_enable` | Push notifications enabled | `notification_type` |
| `notification_disable` | Push notifications disabled | `notification_type` |
| `pwa_install` | PWA install triggered | `install_source` |
| `pwa_install_complete` | PWA installed | `platform` |

### Conversions
| Event Name | Description | Parameters |
|------------|-------------|------------|
| `signup` | User signs up | `signup_method`, `signup_source` |
| `subscription` | User subscribes | `subscription_type`, `tier` |
| `widget_embed` | Widget embed code copied | `widget_type`, `customization` |
| `consent_granted` | User accepts analytics | `consent_type` |

### Errors
| Event Name | Description | Parameters |
|------------|-------------|------------|
| `error` | Application error | `error_type`, `error_message`, `error_stack` |
| `api_error` | API request failed | `endpoint`, `status_code`, `error_message` |
| `load_error` | Resource failed to load | `resource_type`, `resource_url` |

## Implementation Notes

### Consent Management
- Analytics storage defaults to `denied`
- User must explicitly accept via consent banner
- Consent stored in `localStorage` as `wh_analytics_consent`
- Events queued until consent granted

### Debug Mode
On `localhost`, events logged to console and appear in GA4 DebugView.

### Global API
```javascript
window.whAnalytics.track('event_name', { param: 'value' });
window.whAnalytics.optOut();
window.whAnalytics.hasConsent();
```

## Privacy Compliance

### Cookie/Storage Usage
| Storage | Purpose | Duration |
|---------|---------|----------|
| `_ga` | GA4 client ID | 2 years |
| `_ga_*` | GA4 session ID | Session |
| `wh_analytics_consent` | Consent preference | Permanent |
