/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { CorrespondenceDetails } from "@voip/softphone/correspondence_details";
import { browser } from "@web/core/browser/browser";
import { _t } from "@web/core/l10n/translation";
import { useService } from "@web/core/utils/hooks";

patch(CorrespondenceDetails.prototype, {
    setup() {
        super.setup();
        this.notification = useService("notification");
    },

    /**
     * Override the phone number click in contact detail view.
     * Consistent with softphone.js call logic.
     *
     * @param {MouseEvent} ev
     * @param {string} phoneNumber
     */
    async onClickPhoneNumber(ev, phoneNumber) {
        ev.preventDefault();
        ev.stopPropagation();

        if (!phoneNumber) {
            this.notification.add(_t("No phone number found"), { type: "danger" });
            return;
        }

        try {
            const response = await browser.fetch("/acis_3cx/make_call", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
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
                const msg =
                    result.result?.error ||
                    result.error?.message ||
                    _t("3CX call failed");
                this.notification.add(msg, { type: "danger" });
            }
        } catch (e) {
            this.notification.add(e.message || _t("3CX call failed"), { type: "danger" });
        }
    },
});
