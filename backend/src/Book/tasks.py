from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from .models import Borrow

@shared_task
def send_due_date_email(borrow_id):
    borrow = Borrow.objects.get(id=borrow_id)
    subject = "Library Book Due Today"
    message = (
        f"Hi {borrow.user.username},\n\n"
        f"Reminder: Your borrowed book '{borrow.book.title}' is due today.\n"
        "Please return it to avoid penalties."
    )
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [borrow.user.email])

    return f"Email sent to {borrow.user.email}"