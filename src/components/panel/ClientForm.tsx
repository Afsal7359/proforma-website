import { ActionForm } from "./ActionForm";
import {
  Field,
  Row,
  Select,
  TextArea,
  Checkbox,
  CLIENT_STATUS_OPTIONS,
  SUB_STATUS_OPTIONS,
  POSITION_OPTIONS,
} from "@/components/Fields";
import { saveClientAction } from "@/app/actions/people";
import type { ClientOverview, Plan } from "@/lib/types";

/**
 * The athlete form, shared by "Add athlete" and the edit panel on an athlete's
 * page. On create it can mint a portal login and reveal it for WhatsApp.
 */
export function ClientForm({
  client,
  tutors,
  plans,
}: {
  client?: ClientOverview;
  tutors: { id: string; name: string }[];
  plans: Plan[];
}) {
  const isNew = !client;

  return (
    <ActionForm
      action={saveClientAction}
      submitLabel={isNew ? "Create Athlete" : "Save Athlete"}
      hidden={client ? { id: client.id } : undefined}
    >
      <Field
        name="full_name"
        label="Full name"
        required
        defaultValue={client?.full_name}
        autoFocus={isNew}
      />

      <Row cols={3}>
        <Select
          name="position"
          label="Position"
          options={POSITION_OPTIONS}
          placeholder="— none —"
          defaultValue={client?.position}
        />
        <Field
          name="date_of_birth"
          label="Date of birth"
          type="date"
          defaultValue={client?.date_of_birth}
        />
        <Field
          name="age"
          label="Age"
          type="number"
          min={4}
          max={60}
          defaultValue={client?.age}
          hint="Left blank, it's worked out from the date of birth."
        />
      </Row>

      <Row>
        <Field name="city" label="City" defaultValue={client?.city} />
        <Field name="state" label="State" defaultValue={client?.state} />
      </Row>

      <Row>
        <Field
          name="phone"
          label="Phone"
          defaultValue={client?.phone}
          placeholder="9876543210"
          hint="Used for the WhatsApp login invite."
        />
        <Field
          name="email"
          label="Email"
          type="email"
          defaultValue={client?.email}
        />
      </Row>

      <Row>
        <Field
          name="guardian_name"
          label="Guardian name"
          defaultValue={client?.guardian_name}
        />
        <Field
          name="guardian_phone"
          label="Guardian phone"
          defaultValue={client?.guardian_phone}
        />
      </Row>

      <Row cols={3}>
        <Field
          name="height_cm"
          label="Height (cm)"
          type="number"
          step="0.1"
          defaultValue={client?.height_cm}
        />
        <Field
          name="weight_kg"
          label="Weight (kg)"
          type="number"
          step="0.1"
          defaultValue={client?.weight_kg}
        />
        <Select
          name="status"
          label="Athlete status"
          options={CLIENT_STATUS_OPTIONS}
          defaultValue={client?.status ?? "lead"}
        />
      </Row>

      <Row cols={3}>
        <Select
          name="tutor_id"
          label="Assigned coach"
          options={tutors.map((t) => ({ value: t.id, label: t.name }))}
          placeholder="— unassigned —"
          defaultValue={client?.tutor_id}
        />
        <Select
          name="plan_id"
          label="Membership plan"
          options={plans.map((p) => ({ value: p.id, label: p.name }))}
          placeholder="— no plan —"
          defaultValue={client?.plan_id}
        />
        <Select
          name="subscription_status"
          label="Subscription"
          options={SUB_STATUS_OPTIONS}
          defaultValue={client?.subscription_status ?? "none"}
        />
      </Row>

      <Row>
        <Field
          name="subscription_start"
          label="Subscription start"
          type="date"
          defaultValue={client?.subscription_start}
        />
        <Field
          name="subscription_end"
          label="Subscription end"
          type="date"
          defaultValue={client?.subscription_end}
        />
      </Row>

      <Field
        name="goal"
        label="Goal"
        defaultValue={client?.goal}
        placeholder="Trial-ready for U-17 academy intake"
      />
      <TextArea
        name="notes"
        label="Internal notes"
        rows={3}
        defaultValue={client?.notes}
      />

      {isNew && (
        <Checkbox
          name="create_login"
          label="Generate a portal login now"
          defaultChecked
          hint="Creates a login ID and one-time password you can send on WhatsApp."
        />
      )}
    </ActionForm>
  );
}
