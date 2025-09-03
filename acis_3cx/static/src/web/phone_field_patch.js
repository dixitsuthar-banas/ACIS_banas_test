import { patch } from "@web/core/utils/patch";
import { PhoneField } from "@web/views/fields/phone/phone_field";
import { useService } from "@web/core/utils/hooks";
import { _t } from "@web/core/l10n/translation";
import { browser } from "@web/core/browser/browser";

patch(PhoneField.prototype, {
    setup() {
        super.setup();
        this.notification = useService("notification");
    },

    /**
     * Intercepts clicks on phone links or buttons and routes call via Odoo backend proxy.
     *
     * @param {MouseEvent} ev
     */
    async onLinkClicked(ev) {
        if (ev.target.matches("a")) {
            ev.stopImmediatePropagation();
        }
        ev.preventDefault();

        try {
            const fieldName = ev.target.closest(".o_field_phone").getAttribute("name");
            const { record } = this.props;
            const phoneNumber = record.data[fieldName];

            if (!phoneNumber) {
                throw new Error(_t("No phone number found"));
            }

            // Call backend controller to initiate 3CX call
            const response = await browser.fetch("/acis_3cx/make_call", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    method: "call",
                    params: { phone_number: phoneNumber },
                    id: Date.now(),
                }),
            });

            const result = await response.json();

            if (result.result?.success) {
                this.notification.add(_t("Calling %s").replace("%s", phoneNumber), {
                    type: "success",
                });
            } else {
                const errorMsg =
                    result.result?.error ||
                    result.error?.message ||
                    _t("3CX call failed");
                this.notification.add(errorMsg, { type: "danger" });
            }

        } catch (error) {
            this.notification.add(error.message || _t("3CX call failed"), { type: "danger" });
        }
    },
});
