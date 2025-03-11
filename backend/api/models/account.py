from django.db import models

class Account(models.Model):
    acc_code1 = models.CharField(max_length=50, blank=True, null=True)
    acc_code2 = models.CharField(max_length=50, blank=True, null=True)
    acc_code3 = models.CharField(max_length=50, blank=True, null=True)
    acc_code4 = models.CharField(max_length=50, blank=True, null=True)
    acc_name = models.CharField(max_length=100)
    acc_level = models.IntegerField(blank=True, null=True)
    acc_parent = models.ForeignKey('self', on_delete=models.SET_NULL, blank=True, null=True, related_name='children')
    acc_normal_saldo = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    acc_active = models.BooleanField(default=True)
    acc_system = models.BooleanField(default=False)

    def __str__(self):
        return self.acc_name

    class Meta:
        verbose_name = "Account"
        verbose_name_plural = "Accounts"