import { patch } from "@web/core/utils/patch";
import { Softphone } from "@voip/softphone/softphone";
import { browser } from "@web/core/browser/browser";
import { _t } from "@web/core/l10n/translation";
import { useService } from "@web/core/utils/hooks";

patch(Softphone.prototype, {
    setup() {
        super.setup();
        this.notification = useService("notification");
    },

    /**
     * Override the "Call" button behavior in the softphone.
     * Instead of using WebRTC/SIP, send a call initiation request to 3CX via Odoo backend.
     */
    async onClickPhone(ev) {
        if (this.softphone.selectedCorrespondence?.call?.isInProgress) {
            this.userAgent.hangup();
            return;
        }

        const callData = this._getCallData();
        const phoneNumber = callData?.phone_number;

        if (!callData) {
            this.notification.add(_t("No contact selected"), { type: "danger" });
            return;
        }

        if (!phoneNumber) {
            this.notification.add(_t("No phone number found"), { type: "danger" });
            return;
        }

        try {
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
        } catch (e) {
            this.notification.add(e.message || _t("3CX call failed"), { type: "danger" });
        }
    },
});
