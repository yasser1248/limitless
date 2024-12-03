

erpnext.stock.PurchaseReceiptController = class PurchaseReceiptController extends (
	erpnext.buying.BuyingController
) {

	refresh() {
		var me = this;
		erpnext.buying.BuyingController.prototype.refresh.call(this);

		erpnext.accounts.ledger_preview.show_accounting_ledger_preview(this.frm);
		erpnext.accounts.ledger_preview.show_stock_ledger_preview(this.frm);

		if (this.frm.doc.docstatus > 0) {
			this.show_stock_ledger();
			//removed for temporary
			this.show_general_ledger();

			this.frm.add_custom_button(
				__("Asset"),
				function () {
					frappe.route_options = {
						purchase_receipt: me.frm.doc.name,
					};
					frappe.set_route("List", "Asset");
				},
				__("View")
			);

			this.frm.add_custom_button(
				__("Asset Movement"),
				function () {
					frappe.route_options = {
						reference_name: me.frm.doc.name,
					};
					frappe.set_route("List", "Asset Movement");
				},
				__("View")
			);
		}

		if (!this.frm.doc.is_return && this.frm.doc.status != "Closed") {
			if (this.frm.doc.docstatus == 0) {
				this.frm.add_custom_button(
					__("Purchase Order"),
					function () {
						if (!me.frm.doc.supplier) {
							frappe.throw({
								title: __("Mandatory"),
								message: __("Please Select a Supplier"),
							});
						}
						erpnext.utils.map_current_doc({
							method: "limitless.override.whitelist_method.get_mapped_purchase_order",
							source_doctype: "Purchase Order",
							target: me.frm,
							setters: {
								supplier: me.frm.doc.supplier,
								schedule_date: undefined,
							},
							get_query_filters: {
								docstatus: 1,
								status: ["not in", ["Closed", "On Hold"]],
								per_received: ["<", 99.99],
								company: me.frm.doc.company,
							},
						});
					},
					__("Get Items From")
				);
			}

			if (this.frm.doc.docstatus == 1 && this.frm.doc.status != "Closed") {
				if (this.frm.has_perm("submit")) {
					cur_frm.add_custom_button(__("Close"), this.close_purchase_receipt, __("Status"));
				}

				cur_frm.add_custom_button(__("Purchase Return"), this.make_purchase_return, __("Create"));

				cur_frm.add_custom_button(
					__("Make Stock Entry"),
					cur_frm.cscript["Make Stock Entry"],
					__("Create")
				);

				if (flt(this.frm.doc.per_billed) < 100) {
					cur_frm.add_custom_button(
						__("Purchase Invoice"),
						this.make_purchase_invoice,
						__("Create")
					);
				}
				cur_frm.add_custom_button(
					__("Retention Stock Entry"),
					this.make_retention_stock_entry,
					__("Create")
				);

				cur_frm.page.set_inner_btn_group_as_primary(__("Create"));
			}
		}

		if (this.frm.doc.docstatus == 1 && this.frm.doc.status === "Closed" && this.frm.has_perm("submit")) {
			cur_frm.add_custom_button(__("Reopen"), this.reopen_purchase_receipt, __("Status"));
		}

		this.frm.toggle_reqd("supplier_warehouse", this.frm.doc.is_old_subcontracting_flow);
	}
};

extend_cscript(cur_frm.cscript, new erpnext.stock.PurchaseReceiptController({ frm: cur_frm }));

frappe.ui.form.on("Purchase Receipt Item",{

	item_code(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (frm.doc.purchase_order_data && row.item_code) {
            
            let object_data = JSON.parse(frm.doc.purchase_order_data);
            let item_exists = frm.doc.items.filter((x) => x.item_code == row.item_code && row.name != x.name);
            if (row.item_code in object_data && item_exists.length == 0) {
                frappe.model.set_value(cdt, cdn,{ 
                    "purchase_order_item" : object_data[row.item_code].purchase_order_item,
                    "purchase_order" : object_data[row.item_code].purchase_order 
                });
            } else  {
                row.item_code = ""
                frappe.msgprint(item_exists.length >= 1  ? __("Item Exists in Table Items")  : __("Item not found in purchase order.") );
            }
            frm.refresh_field('items');
        }

	} ,
	qty (frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (frm.doc.purchase_order_data && row.item_code) {
            let object_data = JSON.parse(frm.doc.purchase_order_data);
            let orignal_qty = object_data[row.item_code].qty;

            if (row.qty > orignal_qty) {
                frappe.msgprint(__("Quantity must be less than or equal to {0}", [orignal_qty]));
                frappe.model.set_value(cdt, cdn, "qty", orignal_qty);
            }
        }

	}
	
});