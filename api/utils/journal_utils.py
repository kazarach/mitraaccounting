from decimal import Decimal

def get_posting_account(account_number: str):
    """
    Resolve a specific account. If it's a parent account with children,
    return the first active child account instead.
    """
    from ..models import Account
    acc = Account.objects.filter(account_number=account_number, is_active=True).first()
    if not acc:
        raise ValueError(f"Account {account_number} not found.")
    if acc.sub_accounts.exists():
        return acc.sub_accounts.filter(is_active=True).order_by('account_number').first()
    return acc

def create_journal_entries_for_transaction(transaction):
    from ..models import JournalEntry, Account, TransactionType

    # Delete previous journal entries
    JournalEntry.objects.filter(transaction=transaction).delete()

    if not transaction.th_total or transaction.th_total <= 0:
        return

    # Resolve accounts (fallback to first active sub-account if applicable)
    acc_cash = get_posting_account('1100')     # Cash (or sub)
    acc_bank = get_posting_account('1200')     # Bank (or sub)
    acc_ar = get_posting_account('3300')       # AR
    acc_ap = get_posting_account('4400')       # AP
    acc_sales = get_posting_account('5000')    # Revenue
    acc_expense = get_posting_account('9000')  # Expense

    description = f"Auto journal for {transaction.th_code}"
    entries = []

    if transaction.th_type == TransactionType.SALE:
        if transaction.th_payment_type == 'CREDIT':
            # Dr AR, Cr Sales
            entries.append(JournalEntry(
                transaction=transaction, account=acc_ar,
                debit_amount=transaction.th_total, credit_amount=0,
                description=description, date=transaction.th_date
            ))
        else:
            acc = acc_cash if transaction.th_payment_type == 'CASH' else acc_bank
            entries.append(JournalEntry(
                transaction=transaction, account=acc,
                debit_amount=transaction.th_total, credit_amount=0,
                description=description, date=transaction.th_date
            ))
        entries.append(JournalEntry(
            transaction=transaction, account=acc_sales,
            debit_amount=0, credit_amount=transaction.th_total,
            description=description, date=transaction.th_date
        ))

    elif transaction.th_type == TransactionType.PURCHASE:
        if transaction.th_payment_type == 'CREDIT':
            # Dr Expense, Cr AP
            entries.append(JournalEntry(
                transaction=transaction, account=acc_expense,
                debit_amount=transaction.th_total, credit_amount=0,
                description=description, date=transaction.th_date
            ))
            entries.append(JournalEntry(
                transaction=transaction, account=acc_ap,
                debit_amount=0, credit_amount=transaction.th_total,
                description=description, date=transaction.th_date
            ))
        else:
            acc = acc_cash if transaction.th_payment_type == 'CASH' else acc_bank
            entries.append(JournalEntry(
                transaction=transaction, account=acc_expense,
                debit_amount=transaction.th_total, credit_amount=0,
                description=description, date=transaction.th_date
            ))
            entries.append(JournalEntry(
                transaction=transaction, account=acc,
                debit_amount=0, credit_amount=transaction.th_total,
                description=description, date=transaction.th_date
            ))

    elif transaction.th_type == TransactionType.EXPENSE:
        acc = acc_cash if transaction.th_payment_type == 'CASH' else acc_bank
        entries.append(JournalEntry(
            transaction=transaction, account=acc_expense,
            debit_amount=transaction.th_total, credit_amount=0,
            description=description, date=transaction.th_date
        ))
        entries.append(JournalEntry(
            transaction=transaction, account=acc,
            debit_amount=0, credit_amount=transaction.th_total,
            description=description, date=transaction.th_date
        ))

    elif transaction.th_type == TransactionType.RETURN:
        if transaction.customer:
            # Sales return: Cr AR / Cash, Dr Sales (negative revenue)
            acc = acc_cash if transaction.th_payment_type == 'CASH' else acc_ar
            entries.append(JournalEntry(
                transaction=transaction, account=acc_sales,
                debit_amount=transaction.th_total, credit_amount=0,
                description=description, date=transaction.th_date
            ))
            entries.append(JournalEntry(
                transaction=transaction, account=acc,
                debit_amount=0, credit_amount=transaction.th_total,
                description=description, date=transaction.th_date
            ))
        elif transaction.supplier:
            # Purchase return: Cr Expense, Dr Cash / AP
            acc = acc_cash if transaction.th_payment_type == 'CASH' else acc_ap
            entries.append(JournalEntry(
                transaction=transaction, account=acc,
                debit_amount=transaction.th_total, credit_amount=0,
                description=description, date=transaction.th_date
            ))
            entries.append(JournalEntry(
                transaction=transaction, account=acc_expense,
                debit_amount=0, credit_amount=transaction.th_total,
                description=description, date=transaction.th_date
            ))


    JournalEntry.objects.bulk_create(entries)
