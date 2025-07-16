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

    amount = transaction.th_total if transaction.th_total else transaction.th_dp

    if not amount or amount <= 0:
        print(f"[SKIPPED] Journal creation skipped due to missing amount (th_total and th_dp both empty or zero)")
        return
    print("CREATE")
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
                debit_amount=amount, credit_amount=0,
                description=description, date=transaction.th_date
            ))
        else:
            acc = acc_cash if transaction.th_payment_type == 'CASH' else acc_bank
            entries.append(JournalEntry(
                transaction=transaction, account=acc,
                debit_amount=amount, credit_amount=0,
                description=description, date=transaction.th_date
            ))
        entries.append(JournalEntry(
            transaction=transaction, account=acc_sales,
            debit_amount=0, credit_amount=amount,
            description=description, date=transaction.th_date
        ))

    elif transaction.th_type == TransactionType.PURCHASE:
        if transaction.th_payment_type == 'CREDIT':
            # Dr Expense, Cr AP
            entries.append(JournalEntry(
                transaction=transaction, account=acc_expense,
                debit_amount=amount, credit_amount=0,
                description=description, date=transaction.th_date
            ))
            entries.append(JournalEntry(
                transaction=transaction, account=acc_ap,
                debit_amount=0, credit_amount=amount,
                description=description, date=transaction.th_date
            ))
        else:
            acc = acc_cash if transaction.th_payment_type == 'CASH' else acc_bank
            entries.append(JournalEntry(
                transaction=transaction, account=acc_expense,
                debit_amount=amount, credit_amount=0,
                description=description, date=transaction.th_date
            ))
            entries.append(JournalEntry(
                transaction=transaction, account=acc,
                debit_amount=0, credit_amount=amount,
                description=description, date=transaction.th_date
            ))

    elif transaction.th_type == TransactionType.EXPENSE:
        acc = acc_cash if transaction.th_payment_type == 'CASH' else acc_bank
        entries.append(JournalEntry(
            transaction=transaction, account=acc_expense,
            debit_amount=amount, credit_amount=0,
            description=description, date=transaction.th_date
        ))
        entries.append(JournalEntry(
            transaction=transaction, account=acc,
            debit_amount=0, credit_amount=amount,
            description=description, date=transaction.th_date
        ))

    elif transaction.th_type in [TransactionType.RETURN_SALE, TransactionType.RETURN_PURCHASE]:
        if transaction.th_type == TransactionType.RETURN_SALE and transaction.customer:
            # Sales return: Cr AR / Cash, Dr Sales (negative revenue)
            acc = acc_cash if transaction.th_payment_type == 'CASH' else acc_ar
            entries.append(JournalEntry(
                transaction=transaction, account=acc_sales,
                debit_amount=amount, credit_amount=0,
                description=description, date=transaction.th_date
            ))
            entries.append(JournalEntry(
                transaction=transaction, account=acc,
                debit_amount=0, credit_amount=amount,
                description=description, date=transaction.th_date
            ))

        elif transaction.th_type == TransactionType.RETURN_PURCHASE and transaction.supplier:
            # Purchase return: Cr Expense, Dr Cash / AP
            acc = acc_cash if transaction.th_payment_type == 'CASH' else acc_ap
            entries.append(JournalEntry(
                transaction=transaction, account=acc,
                debit_amount=amount, credit_amount=0,
                description=description, date=transaction.th_date
            ))
            entries.append(JournalEntry(
                transaction=transaction, account=acc_expense,
                debit_amount=0, credit_amount=amount,
                description=description, date=transaction.th_date
            ))

    elif transaction.th_type == TransactionType.TRANSFER:
        # You need a way to store both accounts involved
        from_account = transaction.from_account
        to_account = transaction.to_account
        print("transfer")
        print(amount)
        if not from_account or not to_account:
            raise ValueError("TRANSFER requires both from_account and to_account")

        entries.append(JournalEntry(
            transaction=transaction, account=from_account,
            debit_amount=0, credit_amount=amount,
            description=f"Transfer from {from_account.name} to {to_account.name}",
            date=transaction.th_date
        ))
        entries.append(JournalEntry(
            transaction=transaction, account=to_account,
            debit_amount=amount, credit_amount=0,
            description=f"Transfer from {from_account.name} to {to_account.name}",
            date=transaction.th_date
        ))



    JournalEntry.objects.bulk_create(entries)
