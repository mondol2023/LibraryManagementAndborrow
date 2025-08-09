from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta
from .models import Borrow
from .tasks import send_due_date_email  

# @receiver(post_save, sender=Borrow)
# def schedule_due_date_email(sender, instance, created, **kwargs):
#     if created:
#         due_datetime = timezone.make_aware(
#             timezone.datetime.combine(instance.due_date, timezone.datetime.min.time())
#         ) + timedelta(hours=8)

#         delay_seconds = (due_datetime - timezone.now()).total_seconds()

#         send_due_date_email.apply_async(
#             args=[instance.id],
#             countdown=max(0, delay_seconds)
#         )
