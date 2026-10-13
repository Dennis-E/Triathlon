# Data Model: Newsletter Signup

The app does not own or persist newsletter subscriber records. These entities describe the visitor-facing lifecycle and the information handled by the external provider.

## Entities

### Signup Form View

Represents the locally rendered signup invitation and optional embedded provider form.

| Field | Meaning | Constraints |
|---|---|---|
| display state | Whether the invitation or form is visible | `invitation` before an explicit visitor action; `form-requested` after activation |
| provider URL | The supplied Brevo-hosted form destination | Fixed trusted HTTPS URL; not derived from user input |
| fallback URL | Direct navigation to the same Brevo form | Available when embedded display is unavailable or blocked |

### Newsletter Signup Submission

Represents a visitor's submission to Brevo.

| Field | Meaning | Constraints |
|---|---|---|
| email address | Address entered by the visitor | Required and validated by the provider form |
| affirmative consent | Explicit permission to receive TriAnalytica newsletter updates | Must be required before enrollment; provider-owned control |
| submission result | Provider response such as invalid, received, or confirmation required | Communicated by Brevo; the app must not infer it from iframe loading |

### Newsletter Subscription

Represents the provider-managed enrollment for newsletter updates.

| Field | Meaning | Constraints |
|---|---|---|
| lifecycle state | Not submitted, pending confirmation, or confirmed as communicated by Brevo | Provider is the source of truth; no app-side status store |
| subscriber data | Email and consent evidence maintained for enrollment | Processed and retained under the configured provider account; not sent with training files |

## Relationships and Lifecycle

- A visitor can open the signup form without submitting a signup.
- A form view may result in zero or one provider submission per form interaction; the provider handles duplicate submissions/addresses.
- A submission with affirmative consent may remain pending until the provider's confirmation step is completed, then become a confirmed subscription.
- No state transition to subscribed is recorded or asserted by TriAnalytica.
- Closing/leaving the page discards the local form-view state; subscriber records are not stored in page memory beyond the provider iframe's own operation and are not written to app storage.

## Validation and Privacy Rules

- The external request to Brevo begins only after an explicit open-form action.
- Consent is affirmative and specific to newsletter email updates.
- Uploaded activity files, normalized workouts, and training metrics are not fields of this model and must not be sent to Brevo by this feature.
- The provider URL is fixed application configuration, never user-controlled input.