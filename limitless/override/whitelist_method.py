import frappe
import json
from erpnext.buying.doctype.purchase_order.purchase_order import make_purchase_receipt


@frappe.whitelist()
def get_mapped_purchase_order(source_name, target_doc=None):

    purchase_receipt =  make_purchase_receipt(source_name, target_doc)
    default_items = { item.item_code : item.as_dict() for item in purchase_receipt.items }
    purchase_receipt.purchase_order_data = json.dumps(default_items , default=str)
    purchase_receipt.purchase_order_no = source_name

    return purchase_receipt

