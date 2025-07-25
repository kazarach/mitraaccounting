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
    return acc.sub_accounts.filter(is_active=True).order_by('account_number').first() or acc


def create_journal_entries_for_transaction(transaction):
    from ..models import JournalEntry, TransactionType

    # Delete previous journal entries
    JournalEntry.objects.filter(transaction=transaction).delete()

    amount = transaction.th_total or transaction.th_dp
    if not amount or amount <= 0:
        print(f"[SKIPPED] Journal creation skipped for {transaction.th_code} due to missing amount.")
        return

    # Resolve accounts
    acc_cash = get_posting_account('1100')      # Cash
    acc_bank = get_posting_account('1200')      # Bank
    acc_ar = get_posting_account('3300')        # Accounts Receivable
    acc_ap = get_posting_account('4400')        # Accounts Payable
    acc_sales = get_posting_account('5000')     # Sales / Revenue
    acc_expense = get_posting_account('9000')   # Expense

    entries = []
    description = f"Auto journal for {transaction.th_code}"
    ttype = transaction.th_type.code if transaction.th_type else None
    ptype = transaction.th_payment_type

    def debit(account):
        entries.append(JournalEntry(
            transaction=transaction, account=account,
            debit_amount=amount, credit_amount=0,
            description=description, date=transaction.th_date
        ))

    def credit(account):
        entries.append(JournalEntry(
            transaction=transaction, account=account,
            debit_amount=0, credit_amount=amount,
            description=description, date=transaction.th_date
        ))

    if ttype == 'SALE':
        if ptype == 'CREDIT':
            debit(acc_ar)
        else:
            debit(acc_cash if ptype == 'CASH' else acc_bank)
        credit(acc_sales)

    elif ttype == 'PURCHASE':
        debit(acc_expense)
        if ptype == 'CREDIT':
            credit(acc_ap)
        else:
            credit(acc_cash if ptype == 'CASH' else acc_bank)

    elif ttype == 'EXPENSE':
        debit(acc_expense)
        credit(acc_cash if ptype == 'CASH' else acc_bank)

    elif ttype == 'RETURN_SALE' and transaction.customer:
        debit(acc_sales)
        credit(acc_cash if ptype == 'CASH' else acc_ar)

    elif ttype == 'RETURN_PURCHASE' and transaction.supplier:
        debit(acc_cash if ptype == 'CASH' else acc_ap)
        credit(acc_expense)

    elif ttype == 'TRANSFER':
        from_account = transaction.from_account
        to_account = transaction.to_account
        if not from_account or not to_account:
            raise ValueError("TRANSFER requires both from_account and to_account")
        credit(from_account)
        debit(to_account)
        # Update descriptions
        for entry in entries:
            entry.description = f"Transfer from {from_account.name} to {to_account.name}"

    JournalEntry.objects.bulk_create(entries)
