from django.db import models
from django.utils import timezone
from .supplier import Supplier
from .customer import Customer
from .operator import Operator
from .bank import Bank
from .master_account import MasterAccount
from .event_discount import EventDisc
from .sales import Sales
from .stock import Stock

class TransactionHistory(models.Model):
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, blank=True, null=True)
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, blank=True, null=True)
    operator = models.ForeignKey(Operator, on_delete=models.SET_NULL, blank=True, null=True)
    th_number = models.CharField(max_length=50, unique=True)
    th_type = models.CharField(max_length=50)
    th_payment_type = models.CharField(max_length=50, blank=True, null=True)
    th_disc = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    th_disc_type = models.CharField(max_length=20, blank=True, null=True)
    th_ppn = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    th_ppn_type = models.CharField(max_length=20, blank=True, null=True)
    th_round = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    th_dp = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    th_total = models.DecimalField(max_digits=15, decimal_places=2)
    th_date = models.DateTimeField(default=timezone.now)
    th_note = models.TextField(blank=True, null=True)
    th_status = models.CharField(max_length=20, default='active')
    bank = models.ForeignKey(Bank, on_delete=models.SET_NULL, blank=True, null=True)
    ma = models.ForeignKey(MasterAccount, on_delete=models.SET_NULL, blank=True, null=True)
    ed = models.ForeignKey(EventDisc, on_delete=models.SET_NULL, blank=True, null=True)
    th_dp_order = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    th_surcharge = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    th_surcharge_type = models.CharField(max_length=20, blank=True, null=True)
    th_bank_num = models.CharField(max_length=100, blank=True, null=True)
    th_tax_methode = models.CharField(max_length=50, blank=True, null=True)
    th_so_id = models.IntegerField(blank=True, null=True)  # Should be FK to SalesOrder model
    th_ori_id = models.IntegerField(blank=True, null=True)  # Original transaction ID
    sales = models.ForeignKey(Sales, on_delete=models.SET_NULL, blank=True, null=True)
    th_sales_omset = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    th_dp_other = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    th_delivery = models.BooleanField(default=False)
    th_post = models.BooleanField(default=False)
    th_rstatus = models.CharField(max_length=20, blank=True, null=True)
    th_subsidi = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    th_cdate = models.DateTimeField(blank=True, null=True)
    th_retur_id = models.IntegerField(blank=True, null=True)
    tj_tipe = models.CharField(max_length=50, blank=True, null=True)
    th_point = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    th_point_ditukar = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    th_point_nominal = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    th_ol_number = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return self.th_number

    class Meta:
        verbose_name = "Transaction History"
        verbose_name_plural = "Transaction Histories"
        indexes = [
            models.Index(fields=['th_date']),
            models.Index(fields=['th_status']),
        ]


class TransItemDetail(models.Model):
    th = models.ForeignKey(TransactionHistory, on_delete=models.CASCADE, related_name='items')
    stock_parent = models.ForeignKey(Stock, on_delete=models.CASCADE, related_name='parent_items')
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, related_name='transaction_items')
    tid_amount = models.DecimalField(max_digits=15, decimal_places=2)
    tid_sell_hpp = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)

    def __str__(self):
        return f"{self.th.th_number} - {self.stock.stock_name}"

    class Meta:
        verbose_name = "Transaction Item Detail"
        verbose_name_plural = "Transaction Item Details"