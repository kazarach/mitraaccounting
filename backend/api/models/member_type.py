from django.db import models

class MemberType(models.Model):
    mt_code = models.CharField(max_length=50, unique=True)
    mt_name = models.CharField(max_length=100)
    mt_omset = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)

    def __str__(self):
        return self.mt_name

    class Meta:
        verbose_name = "Member Type"
        verbose_name_plural = "Member Types"