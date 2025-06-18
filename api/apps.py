from django.apps import AppConfig

class YourAppConfig(AppConfig):
    name = 'api'

    def ready(self):
        print("=== APP READY METHOD CALLED ===")
        # import api.signals.hutangpiutang
        # import api.signals.payment