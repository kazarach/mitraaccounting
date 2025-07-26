from django.db.models import Sum, Q, F, ExpressionWrapper, DecimalField
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from drf_spectacular.utils import extend_schema_view, extend_schema
from ..models import Account, JournalEntry, TransactionHistory

@extend_schema_view(
    trial_balance=extend_schema(
        summary="Trial Balance Report",
        description="Get trial balance showing all accounts with debit/credit totals.",
        tags=["Financial"]
    ),
    balance_sheet=extend_schema(
        summary="Balance Sheet Report",
        description="Generate a balance sheet showing assets, liabilities, and equity.",
        tags=["Financial"]
    ),
    income_statement=extend_schema(
        summary="Income Statement (Profit & Loss)",
        description="Shows revenue and expenses to calculate net income.",
        tags=["Financial"]
    ),
    cash_flow_statement=extend_schema(
        summary="Cash Flow Statement",
        description="Shows cash inflows and outflows for a given period.",
        tags=["Financial"]
    )
)
class FinancialReportsViewSet(viewsets.ViewSet):
    """
    ViewSet for generating financial reports using journal entries
    """
    permission_classes = [permissions.IsAuthenticated]

    def _get_date_range_filter(self, field, start_date, end_date):
        if start_date and end_date:
            return Q(**{f"{field}__range": [start_date, end_date]})
        return Q()

    def _annotate_account_balance(self, qs, account_type, as_of_date):
        if account_type in ['ASSET', 'EXPENSE']:
            return qs.annotate(balance_as_of=Sum(
                'journal_entries__debit_amount',
                filter=Q(journal_entries__date__lte=as_of_date)
            ) - Sum(
                'journal_entries__credit_amount',
                filter=Q(journal_entries__date__lte=as_of_date)
            ))
        else:
            return qs.annotate(balance_as_of=Sum(
                'journal_entries__credit_amount',
                filter=Q(journal_entries__date__lte=as_of_date)
            ) - Sum(
                'journal_entries__debit_amount',
                filter=Q(journal_entries__date__lte=as_of_date)
            ))

    @action(detail=False, methods=['get'])
    def trial_balance(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        date_filter = self._get_date_range_filter('journal_entries__date', start_date, end_date)

        accounts = Account.objects.filter(is_active=True).annotate(
            total_debit=Sum('journal_entries__debit_amount', filter=date_filter),
            total_credit=Sum('journal_entries__credit_amount', filter=date_filter)
        ).order_by('account_number')

        trial_balance_data = []
        total_debits = total_credits = 0

        for account in accounts:
            debit_total = account.total_debit or 0
            credit_total = account.total_credit or 0

            if account.account_type in ['ASSET', 'EXPENSE']:
                net = debit_total - credit_total
                debit_balance = max(net, 0)
                credit_balance = abs(min(net, 0))
            else:
                net = credit_total - debit_total
                credit_balance = max(net, 0)
                debit_balance = abs(min(net, 0))

            trial_balance_data.append({
                'account_number': account.account_number,
                'account_name': account.name,
                'account_type': account.account_type,
                'debit_balance': float(debit_balance),
                'credit_balance': float(credit_balance),
                'current_balance': float(account.balance)
            })

            total_debits += debit_balance
            total_credits += credit_balance

        return Response({
            'trial_balance': trial_balance_data,
            'total_debits': float(total_debits),
            'total_credits': float(total_credits),
            'is_balanced': abs(total_debits - total_credits) < 0.01,
            'period': f"{start_date} to {end_date}" if start_date and end_date else "All time"
        })

    @action(detail=False, methods=['get'])
    def balance_sheet(self, request):
        as_of_date = request.query_params.get('as_of_date') or timezone.now().date()

        asset_qs = self._annotate_account_balance(
            Account.objects.filter(account_type='ASSET', is_active=True), 'ASSET', as_of_date)
        liability_qs = self._annotate_account_balance(
            Account.objects.filter(account_type='LIABILITY', is_active=True), 'LIABILITY', as_of_date)
        equity_qs = self._annotate_account_balance(
            Account.objects.filter(account_type='EQUITY', is_active=True), 'EQUITY', as_of_date)

        assets_data = [
            {'account_number': a.account_number, 'account_name': a.name, 'balance': float(a.balance_as_of or 0)}
            for a in asset_qs
        ]
        liabilities_data = [
            {'account_number': a.account_number, 'account_name': a.name, 'balance': float(a.balance_as_of or 0)}
            for a in liability_qs
        ]
        equity_data = [
            {'account_number': a.account_number, 'account_name': a.name, 'balance': float(a.balance_as_of or 0)}
            for a in equity_qs
        ]

        total_assets = sum(a['balance'] for a in assets_data)
        total_liabilities = sum(l['balance'] for l in liabilities_data)
        total_equity = sum(e['balance'] for e in equity_data)

        return Response({
            'assets': assets_data,
            'liabilities': liabilities_data,
            'equity': equity_data,
            'total_assets': total_assets,
            'total_liabilities': total_liabilities,
            'total_equity': total_equity,
            'is_balanced': abs(total_assets - (total_liabilities + total_equity)) < 0.01,
            'as_of_date': as_of_date
        })

    @action(detail=False, methods=['get'])
    def income_statement(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        date_filter = self._get_date_range_filter('journal_entries__date', start_date, end_date)

        revenues = Account.objects.filter(account_type='REVENUE', is_active=True).annotate(
            period_balance=Sum('journal_entries__credit_amount', filter=date_filter) -
                           Sum('journal_entries__debit_amount', filter=date_filter)
        )

        expenses = Account.objects.filter(account_type='EXPENSE', is_active=True).annotate(
            period_balance=Sum('journal_entries__debit_amount', filter=date_filter) -
                           Sum('journal_entries__credit_amount', filter=date_filter)
        )

        revenue_data = [
            {'account_number': r.account_number, 'account_name': r.name, 'amount': float(r.period_balance or 0)}
            for r in revenues
        ]
        expense_data = [
            {'account_number': e.account_number, 'account_name': e.name, 'amount': float(e.period_balance or 0)}
            for e in expenses
        ]

        total_revenue = sum(r['amount'] for r in revenue_data)
        total_expenses = sum(e['amount'] for e in expense_data)
        net_income = total_revenue - total_expenses

        return Response({
            'revenue': revenue_data,
            'expenses': expense_data,
            'total_revenue': total_revenue,
            'total_expenses': total_expenses,
            'net_income': net_income,
            'period': f"{start_date} to {end_date}" if start_date and end_date else "All time"
        })

    @action(detail=False, methods=['get'])
    def cash_flow_statement(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        date_filter = self._get_date_range_filter('date', start_date, end_date)

        cash_accounts = Account.objects.filter(account_type='ASSET', account_number__startswith='11', is_active=True)

        cash_flows = []
        total_inflows = total_outflows = 0

        for account in cash_accounts:
            entries = JournalEntry.objects.filter(account=account).filter(date_filter)
            inflows = sum(e.debit_amount for e in entries)
            outflows = sum(e.credit_amount for e in entries)
            cash_flows.append({
                'account': account.name,
                'inflows': float(inflows),
                'outflows': float(outflows),
                'net_flow': float(inflows - outflows)
            })
            total_inflows += inflows
            total_outflows += outflows

        return Response({
            'cash_flows': cash_flows,
            'total_inflows': float(total_inflows),
            'total_outflows': float(total_outflows),
            'net_cash_flow': float(total_inflows - total_outflows),
            'period': f"{start_date} to {end_date}" if start_date and end_date else "All time"
        })
