import { ActionForm, InlineAction } from "@/components/panel/ActionForm";
import { Field } from "@/components/Fields";
import { noopSave, noopDelete } from "./actions";

export const dynamic = "force-dynamic";

export default function FormTest() {
  return (
    <div className="card-body">
      <ActionForm
        action={noopSave}
        submitLabel="Save Video"
        hidden={{ id: "abc" }}
        footer={
          <InlineAction
            action={noopDelete}
            label="Delete"
            icon="trash"
            className="btn btn-danger btn-sm"
            hidden={{ id: "abc" }}
          />
        }
      >
        <Field name="demo" label="Demo" defaultValue="hello" />
      </ActionForm>
    </div>
  );
}
