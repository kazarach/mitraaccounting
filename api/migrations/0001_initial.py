# Generated by Django 5.2 on 2025-05-09 09:30

import django.contrib.auth.validators
import django.db.models.deletion
import django.utils.timezone
import mptt.fields
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='EventDisc',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(max_length=50, unique=True)),
                ('name', models.CharField(max_length=100)),
                ('date_start', models.DateField(blank=True, null=True)),
                ('date_end', models.DateField(blank=True, null=True)),
                ('type', models.CharField(blank=True, max_length=50, null=True)),
            ],
            options={
                'verbose_name': 'Event Discount',
                'verbose_name_plural': 'Event Discounts',
            },
        ),
        migrations.CreateModel(
            name='LogDrawer',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('ld_date', models.DateTimeField(default=django.utils.timezone.now)),
                ('ld_reason', models.TextField(blank=True, null=True)),
            ],
            options={
                'verbose_name': 'Log Drawer',
                'verbose_name_plural': 'Log Drawers',
            },
        ),
        migrations.CreateModel(
            name='MemberType',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('mt_code', models.CharField(max_length=50, unique=True)),
                ('mt_name', models.CharField(max_length=100)),
                ('mt_omset', models.DecimalField(blank=True, decimal_places=2, max_digits=15, null=True)),
            ],
            options={
                'verbose_name': 'Member Type',
                'verbose_name_plural': 'Member Types',
            },
        ),
        migrations.CreateModel(
            name='MyIndex',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('mi_name', models.CharField(max_length=100, unique=True)),
                ('mi_value', models.CharField(blank=True, max_length=255, null=True)),
            ],
            options={
                'verbose_name': 'My Index',
                'verbose_name_plural': 'My Indexes',
            },
        ),
        migrations.CreateModel(
            name='PriceCategory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('description', models.TextField(blank=True, null=True)),
                ('is_default', models.BooleanField(default=False)),
            ],
            options={
                'verbose_name': 'Price Category',
                'verbose_name_plural': 'Price Categories',
            },
        ),
        migrations.CreateModel(
            name='Rack',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('rack_code', models.CharField(max_length=50, unique=True)),
                ('rack_name', models.CharField(max_length=100)),
            ],
            options={
                'verbose_name': 'Rack',
                'verbose_name_plural': 'Racks',
            },
        ),
        migrations.CreateModel(
            name='Unit',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('unit_code', models.CharField(max_length=20, unique=True)),
                ('unit_name', models.CharField(max_length=50)),
            ],
            options={
                'verbose_name': 'Unit',
                'verbose_name_plural': 'Units',
            },
        ),
        migrations.CreateModel(
            name='UserRole',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50, unique=True)),
                ('level', models.PositiveIntegerField(default=0)),
            ],
        ),
        migrations.CreateModel(
            name='Warehouse',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('gudang_name', models.CharField(max_length=100)),
                ('gudang_code', models.CharField(max_length=50, unique=True)),
            ],
            options={
                'verbose_name': 'Warehouse',
                'verbose_name_plural': 'Warehouses',
            },
        ),
        migrations.CreateModel(
            name='UserAccount',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('is_superuser', models.BooleanField(default=False, help_text='Designates that this user has all permissions without explicitly assigning them.', verbose_name='superuser status')),
                ('username', models.CharField(error_messages={'unique': 'A user with that username already exists.'}, help_text='Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.', max_length=150, unique=True, validators=[django.contrib.auth.validators.UnicodeUsernameValidator()], verbose_name='username')),
                ('first_name', models.CharField(blank=True, max_length=150, verbose_name='first name')),
                ('last_name', models.CharField(blank=True, max_length=150, verbose_name='last name')),
                ('email', models.EmailField(blank=True, max_length=254, verbose_name='email address')),
                ('is_staff', models.BooleanField(default=False, help_text='Designates whether the user can log into this admin site.', verbose_name='staff status')),
                ('is_active', models.BooleanField(default=True, help_text='Designates whether this user should be treated as active. Unselect this instead of deleting accounts.', verbose_name='active')),
                ('date_joined', models.DateTimeField(default=django.utils.timezone.now, verbose_name='date joined')),
                ('groups', models.ManyToManyField(blank=True, help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.', related_name='user_set', related_query_name='user', to='auth.group', verbose_name='groups')),
                ('user_permissions', models.ManyToManyField(blank=True, help_text='Specific permissions for this user.', related_name='user_set', related_query_name='user', to='auth.permission', verbose_name='user permissions')),
                ('role', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.userrole')),
            ],
            options={
                'verbose_name': 'user',
                'verbose_name_plural': 'users',
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='Account',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('account_number', models.CharField(max_length=10, unique=True)),
                ('name', models.CharField(max_length=100)),
                ('description', models.TextField(blank=True, null=True)),
                ('account_type', models.CharField(choices=[('ASSET', 'Asset'), ('LIABILITY', 'Liability'), ('EQUITY', 'Equity'), ('REVENUE', 'Revenue'), ('EXPENSE', 'Expense')], default='ASSET', max_length=20)),
                ('is_active', models.BooleanField(default=True)),
                ('balance', models.DecimalField(decimal_places=2, default=0.0, max_digits=15)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('parent_account', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='sub_accounts', to='api.account')),
            ],
            options={
                'ordering': ['account_number'],
            },
        ),
        migrations.CreateModel(
            name='Bank',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(max_length=50, unique=True)),
                ('name', models.CharField(max_length=100)),
                ('type', models.CharField(blank=True, max_length=50, null=True)),
                ('cb', models.CharField(blank=True, max_length=50, null=True)),
                ('active', models.BooleanField(default=True)),
                ('acc', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.account')),
            ],
            options={
                'verbose_name': 'Bank',
                'verbose_name_plural': 'Banks',
            },
        ),
        migrations.CreateModel(
            name='Category',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
                ('code', models.CharField(max_length=50, unique=True)),
                ('spc_margin', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('spc_status', models.BooleanField(default=True)),
                ('spc_online', models.BooleanField(default=True)),
                ('lft', models.PositiveIntegerField(editable=False)),
                ('rght', models.PositiveIntegerField(editable=False)),
                ('tree_id', models.PositiveIntegerField(db_index=True, editable=False)),
                ('level', models.PositiveIntegerField(editable=False)),
                ('parent', mptt.fields.TreeForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='children', to='api.category')),
            ],
            options={
                'verbose_name': 'Category',
                'verbose_name_plural': 'Categories',
            },
        ),
        migrations.CreateModel(
            name='Customer',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(max_length=50, unique=True)),
                ('name', models.CharField(max_length=100)),
                ('address', models.TextField(blank=True, null=True)),
                ('telp', models.CharField(blank=True, max_length=50, null=True)),
                ('contact', models.CharField(blank=True, max_length=100, null=True)),
                ('npwp', models.CharField(blank=True, max_length=50, null=True)),
                ('discount', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('discount_type', models.CharField(blank=True, max_length=20, null=True)),
                ('due_period', models.IntegerField(blank=True, null=True)),
                ('active', models.BooleanField(default=True)),
                ('point', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('customer_date', models.DateField(blank=True, null=True)),
                ('duedate', models.DateField(blank=True, null=True)),
                ('changed', models.DateTimeField(auto_now=True)),
                ('credit_term_days', models.IntegerField(default=14)),
                ('member_type', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.membertype')),
                ('price_category', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='customers', to='api.pricecategory')),
            ],
            options={
                'verbose_name': 'Customer',
                'verbose_name_plural': 'Customers',
            },
        ),
        migrations.CreateModel(
            name='Sales',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(max_length=50, unique=True)),
                ('name', models.CharField(max_length=100)),
                ('phone', models.CharField(blank=True, max_length=50, null=True)),
                ('address', models.TextField(blank=True, null=True)),
                ('target', models.DecimalField(blank=True, decimal_places=2, max_digits=15, null=True)),
                ('note', models.TextField(blank=True, null=True)),
                ('active', models.BooleanField(default=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Sales',
                'verbose_name_plural': 'Sales',
            },
        ),
        migrations.CreateModel(
            name='Stock',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(max_length=50, unique=True)),
                ('barcode', models.CharField(blank=True, db_index=True, max_length=100, null=True)),
                ('name', models.CharField(max_length=255)),
                ('quantity', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('price_buy', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('margin', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('hpp', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('min_stock', models.DecimalField(blank=True, decimal_places=2, max_digits=15, null=True)),
                ('max_stock', models.DecimalField(blank=True, decimal_places=2, max_digits=15, null=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('is_active', models.BooleanField(default=True)),
                ('is_online', models.BooleanField(default=False)),
                ('parent_conversion', models.DecimalField(blank=True, decimal_places=2, help_text='Conversion rate from this unit to parent unit', max_digits=15, null=True)),
                ('category', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.category')),
                ('parent_stock', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='child_stocks', to='api.stock')),
                ('rack', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.rack')),
            ],
            options={
                'verbose_name': 'Stock',
                'verbose_name_plural': 'Stocks',
            },
        ),
        migrations.CreateModel(
            name='EventDiscItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('disc', models.DecimalField(decimal_places=2, max_digits=10)),
                ('disc_type', models.CharField(max_length=20)),
                ('num', models.IntegerField(blank=True, null=True)),
                ('set', models.IntegerField(blank=True, null=True)),
                ('type', models.CharField(blank=True, max_length=50, null=True)),
                ('ed', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='api.eventdisc')),
                ('stock', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.stock')),
            ],
            options={
                'verbose_name': 'Event Discount Item',
                'verbose_name_plural': 'Event Discount Items',
            },
        ),
        migrations.CreateModel(
            name='StockPrice',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('margin', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('margin_type', models.CharField(blank=True, max_length=20, null=True)),
                ('price_sell', models.DecimalField(decimal_places=2, max_digits=15)),
                ('is_default', models.BooleanField(default=False)),
                ('start_date', models.DateField(blank=True, null=True)),
                ('end_date', models.DateField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('allow_below_cost', models.BooleanField(default=False)),
                ('price_category', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.pricecategory')),
                ('stock', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sales_prices', to='api.stock')),
            ],
            options={
                'verbose_name': 'Sales Price',
                'verbose_name_plural': 'Sales Prices',
            },
        ),
        migrations.CreateModel(
            name='StockPriceHistory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('old_price', models.DecimalField(decimal_places=2, max_digits=15)),
                ('new_price', models.DecimalField(decimal_places=2, max_digits=15)),
                ('change_reason', models.CharField(blank=True, max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('changed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
                ('price_category', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.pricecategory')),
                ('stock', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='price_history', to='api.stock')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='Supplier',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(max_length=50, unique=True)),
                ('name', models.CharField(max_length=100)),
                ('address', models.TextField(blank=True, null=True)),
                ('phone', models.CharField(blank=True, max_length=50, null=True)),
                ('contact_person', models.CharField(blank=True, max_length=100, null=True)),
                ('npwp', models.CharField(blank=True, max_length=50, null=True)),
                ('platform', models.CharField(blank=True, max_length=50, null=True)),
                ('credit_term_days', models.IntegerField(default=30)),
                ('discount', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('discount_type', models.CharField(blank=True, max_length=20, null=True)),
                ('due_days', models.IntegerField(blank=True, help_text='Payment due in days', null=True)),
                ('is_active', models.BooleanField(default=True)),
                ('lft', models.PositiveIntegerField(editable=False)),
                ('rght', models.PositiveIntegerField(editable=False)),
                ('tree_id', models.PositiveIntegerField(db_index=True, editable=False)),
                ('level', models.PositiveIntegerField(editable=False)),
                ('parent', mptt.fields.TreeForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='children', to='api.supplier')),
            ],
            options={
                'verbose_name': 'Supplier',
                'verbose_name_plural': 'Suppliers',
            },
        ),
        migrations.AddField(
            model_name='stock',
            name='supplier',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.supplier'),
        ),
        migrations.CreateModel(
            name='ARAP',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('is_receivable', models.BooleanField()),
                ('total_amount', models.DecimalField(decimal_places=2, max_digits=15)),
                ('total_paid', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('customer', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='api.customer')),
                ('supplier', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='api.supplier')),
            ],
            options={
                'verbose_name': 'ARAP',
                'verbose_name_plural': 'ARAPs',
            },
        ),
        migrations.CreateModel(
            name='TransactionHistory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('th_code', models.CharField(blank=True, max_length=50, unique=True)),
                ('th_type', models.CharField(choices=[('SALE', 'Sale'), ('PURCHASE', 'Purchase'), ('RETURN_SALE', 'Sales Return'), ('RETURN_PURCHASE', 'Purchase Return'), ('USAGE', 'Internal Usage'), ('TRANSFER', 'Transfer'), ('PAYMENT', 'Payment'), ('RECEIPT', 'Receipt'), ('ADJUSTMENT', 'Adjustment'), ('EXPENSE', 'Expense')], max_length=50)),
                ('th_payment_type', models.CharField(choices=[('BANK', 'Bank'), ('CASH', 'Cash'), ('CREDIT', 'Credit')], max_length=50)),
                ('th_disc', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('th_ppn', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('th_dp', models.DecimalField(blank=True, decimal_places=2, max_digits=15, null=True)),
                ('th_total', models.DecimalField(blank=True, decimal_places=2, max_digits=15, null=True)),
                ('th_date', models.DateTimeField(default=django.utils.timezone.now)),
                ('th_note', models.TextField(blank=True, null=True)),
                ('th_due_date', models.DateTimeField(blank=True, null=True)),
                ('th_status', models.BooleanField(default=True)),
                ('th_delivery', models.BooleanField(default=False)),
                ('th_order', models.BooleanField(default=False)),
                ('th_point', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('bank', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.bank')),
                ('cashier', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='cashier_transactions', to=settings.AUTH_USER_MODEL)),
                ('customer', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.customer')),
                ('event_discount', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.eventdisc')),
                ('supplier', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.supplier')),
                ('th_retur', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='returns', to='api.transactionhistory')),
                ('th_so', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='sales_orders', to='api.sales')),
            ],
            options={
                'verbose_name': 'Transaction History',
                'verbose_name_plural': 'Transaction Histories',
            },
        ),
        migrations.CreateModel(
            name='Payment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('payment_type', models.CharField(choices=[('INITIAL', 'Initial Payment'), ('ADDITIONAL', 'Additional Payment'), ('RETURN', 'Payment Return')], max_length=50)),
                ('amount', models.DecimalField(decimal_places=2, max_digits=15)),
                ('payment_method', models.CharField(blank=True, max_length=50, null=True)),
                ('bank_reference', models.CharField(blank=True, max_length=100, null=True)),
                ('payment_date', models.DateTimeField(default=django.utils.timezone.now)),
                ('notes', models.TextField(blank=True, null=True)),
                ('status', models.CharField(default='COMPLETED', max_length=20)),
                ('reference_id', models.IntegerField(blank=True, null=True)),
                ('bank', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.bank')),
                ('original_payment', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='related_payments', to='api.payment')),
                ('operator', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
                ('transaction', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='payments', to='api.transactionhistory')),
            ],
            options={
                'verbose_name': 'Payment',
                'verbose_name_plural': 'Payments',
            },
        ),
        migrations.CreateModel(
            name='JournalEntry',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('description', models.CharField(max_length=255)),
                ('debit_amount', models.DecimalField(decimal_places=2, default=0.0, max_digits=15)),
                ('credit_amount', models.DecimalField(decimal_places=2, default=0.0, max_digits=15)),
                ('date', models.DateTimeField(default=django.utils.timezone.now)),
                ('account', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='journal_entries', to='api.account')),
                ('transaction', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='journal_entries', to='api.transactionhistory')),
            ],
            options={
                'verbose_name': 'Journal Entry',
                'verbose_name_plural': 'Journal Entries',
            },
        ),
        migrations.CreateModel(
            name='ARAPTransaction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('amount', models.DecimalField(decimal_places=2, max_digits=15)),
                ('paid', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('due_date', models.DateField(blank=True, null=True)),
                ('arap', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='transactions', to='api.arap')),
                ('transaction_history', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='arap_transaction', to='api.transactionhistory')),
            ],
        ),
        migrations.CreateModel(
            name='TransItemDetail',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('stock_code', models.CharField(max_length=50)),
                ('stock_name', models.CharField(max_length=255)),
                ('stock_price_buy', models.DecimalField(decimal_places=2, max_digits=15)),
                ('quantity', models.DecimalField(decimal_places=2, max_digits=15)),
                ('sell_price', models.DecimalField(blank=True, decimal_places=2, default=0, max_digits=15, null=True)),
                ('disc', models.DecimalField(blank=True, decimal_places=2, default=0, max_digits=15, null=True)),
                ('disc_percent', models.DecimalField(blank=True, decimal_places=2, default=0, max_digits=15, null=True)),
                ('disc_percent2', models.DecimalField(blank=True, decimal_places=2, default=0, max_digits=15, null=True)),
                ('total', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('netto', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('stock', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='transaction_items', to='api.stock')),
                ('transaction', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='api.transactionhistory')),
            ],
            options={
                'verbose_name': 'Transaction Item Detail',
                'verbose_name_plural': 'Transaction Item Details',
            },
        ),
        migrations.CreateModel(
            name='StockAssembly',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('assembly_price_buy', models.DecimalField(blank=True, decimal_places=2, max_digits=15, null=True)),
                ('assembly_amount', models.DecimalField(decimal_places=2, max_digits=15)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('is_manual_price', models.BooleanField(default=False)),
                ('component_stock', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='used_in_assemblies', to='api.stock')),
                ('parent_stock', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='assemblies', to='api.stock')),
                ('unit', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.unit')),
            ],
            options={
                'verbose_name': 'Stock Assembly',
                'verbose_name_plural': 'Stock Assemblies',
            },
        ),
        migrations.AddField(
            model_name='stock',
            name='unit',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='stocks', to='api.unit'),
        ),
        migrations.AddField(
            model_name='stock',
            name='warehouse',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.warehouse'),
        ),
        migrations.AddIndex(
            model_name='account',
            index=models.Index(fields=['account_number'], name='api_account_account_32cec2_idx'),
        ),
        migrations.AddIndex(
            model_name='account',
            index=models.Index(fields=['account_type'], name='api_account_account_c36a9d_idx'),
        ),
        migrations.AddIndex(
            model_name='stockprice',
            index=models.Index(fields=['stock', 'is_default'], name='api_stockpr_stock_i_f78eb8_idx'),
        ),
        migrations.AddIndex(
            model_name='stockprice',
            index=models.Index(fields=['start_date', 'end_date'], name='api_stockpr_start_d_06c7b7_idx'),
        ),
        migrations.AddConstraint(
            model_name='stockprice',
            constraint=models.UniqueConstraint(fields=('stock', 'price_category'), name='unique_sales_price_per_category'),
        ),
        migrations.AddIndex(
            model_name='transactionhistory',
            index=models.Index(fields=['th_date'], name='api_transac_th_date_b365fc_idx'),
        ),
        migrations.AddIndex(
            model_name='transactionhistory',
            index=models.Index(fields=['th_status'], name='api_transac_th_stat_804821_idx'),
        ),
        migrations.AddIndex(
            model_name='payment',
            index=models.Index(fields=['payment_date'], name='api_payment_payment_d80323_idx'),
        ),
        migrations.AddIndex(
            model_name='payment',
            index=models.Index(fields=['payment_type'], name='api_payment_payment_ad5f22_idx'),
        ),
        migrations.AddIndex(
            model_name='payment',
            index=models.Index(fields=['status'], name='api_payment_status_c61efc_idx'),
        ),
        migrations.AddIndex(
            model_name='journalentry',
            index=models.Index(fields=['date'], name='api_journal_date_7624cd_idx'),
        ),
        migrations.AddIndex(
            model_name='stockassembly',
            index=models.Index(fields=['parent_stock'], name='api_stockas_parent__e8c77f_idx'),
        ),
        migrations.AddIndex(
            model_name='stockassembly',
            index=models.Index(fields=['component_stock'], name='api_stockas_compone_8b429b_idx'),
        ),
        migrations.AddConstraint(
            model_name='stockassembly',
            constraint=models.UniqueConstraint(fields=('parent_stock', 'component_stock'), name='unique_component_per_assembly'),
        ),
        migrations.AddIndex(
            model_name='stock',
            index=models.Index(fields=['barcode'], name='api_stock_barcode_5b80fd_idx'),
        ),
        migrations.AddIndex(
            model_name='stock',
            index=models.Index(fields=['name'], name='api_stock_name_1e4997_idx'),
        ),
        migrations.AddIndex(
            model_name='stock',
            index=models.Index(fields=['is_active'], name='api_stock_is_acti_fc23f5_idx'),
        ),
    ]
