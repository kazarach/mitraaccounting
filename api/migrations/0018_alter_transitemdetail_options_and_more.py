# Generated by Django 5.2 on 2025-07-25 09:41

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0017_transactiontype_remove_transactionhistory_th_type_and_more'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='transitemdetail',
            options={},
        ),
        migrations.RemoveField(
            model_name='transactionhistory',
            name='th_types',
        ),
        migrations.AddField(
            model_name='transactionhistory',
            name='th_type',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.transactiontype'),
        ),
    ]
