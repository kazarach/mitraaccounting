# Generated by Django 5.2 on 2025-06-19 09:23

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0013_remove_araptransaction_is_closed'),
    ]

    operations = [
        migrations.AlterField(
            model_name='araptransaction',
            name='amount',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=15),
        ),
    ]
