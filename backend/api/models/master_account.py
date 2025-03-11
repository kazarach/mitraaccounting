from django.db import models

class MasterAccount(models.Model):
    ma_code = models.CharField(max_length=50, unique=True)
    ma_name = models.CharField(max_length=100)
    ma_type = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return self.ma_name

    class Meta:
        verbose_name = "Master Account"
        verbose_name_plural = "Master Accounts"