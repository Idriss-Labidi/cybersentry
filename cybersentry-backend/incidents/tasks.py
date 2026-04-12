from celery import shared_task
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings

user_model = get_user_model()


@shared_task(bind=True, max_retries=3)
def send_ticket_assignment_notification(self, ticket_id: int, assigned_to_user_id: int, assigned_by_user_id: int):
    """
    Send email notification when a ticket is assigned to a user.
    This task is executed asynchronously using Celery.
    """
    try:
        from incidents.models import IncidentTicket

        ticket = IncidentTicket.objects.get(pk=ticket_id)
        assigned_user = user_model.objects.get(pk=assigned_to_user_id)
        assigned_by_user = user_model.objects.get(pk=assigned_by_user_id)

        context = {
            'ticket_title': ticket.title,
            'ticket_id': ticket.id,
            'priority': ticket.get_priority_display(),
            'assigned_by': assigned_by_user.get_full_name() or assigned_by_user.email,
            'ticket_url': f"http://localhost:3000/dashboard/incidents/{ticket.id}",  # Frontend URL
        }

        subject = f'Ticket Assigned: {ticket.title}'
        html_message = render_to_string('incidents/email/ticket_assignment.html', context)
        plain_message = render_to_string('incidents/email/ticket_assignment.txt', context)

        send_mail(
            subject=subject,
            message=plain_message,
            html_message=html_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[assigned_user.email],
            fail_silently=False,
        )

    except user_model.DoesNotExist:
        pass
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@shared_task(bind=True, max_retries=3)
def send_ticket_comment_notification(self, ticket_id: int, comment_author_id: int, recipient_user_ids: list[int]):
    """
    Send email notification when a comment is added to a ticket.
    Notifies all participants (creator, assignee, other commenters).
    """
    try:
        from incidents.models import IncidentTicket

        ticket = IncidentTicket.objects.get(pk=ticket_id)
        comment_author = user_model.objects.get(pk=comment_author_id)
        recipients = user_model.objects.filter(pk__in=recipient_user_ids).exclude(pk=comment_author_id)

        context = {
            'ticket_title': ticket.title,
            'ticket_id': ticket.id,
            'author': comment_author.get_full_name() or comment_author.email,
            'ticket_url': f"http://localhost:3000/dashboard/incidents/{ticket.id}",
        }

        subject = f'New comment on ticket: {ticket.title}'
        html_message = render_to_string('incidents/email/ticket_comment.html', context)
        plain_message = render_to_string('incidents/email/ticket_comment.txt', context)

        for recipient in recipients:
            send_mail(
                subject=subject,
                message=plain_message,
                html_message=html_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient.email],
                fail_silently=True,
            )

    except user_model.DoesNotExist:
        pass
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@shared_task(bind=True, max_retries=3)
def send_ticket_closure_notification(self, ticket_id: int, closed_by_user_id: int, recipient_user_ids: list[int]):
    """
    Send email notification when a ticket is closed.
    Notifies all participants.
    """
    try:
        from incidents.models import IncidentTicket

        ticket = IncidentTicket.objects.get(pk=ticket_id)
        closed_by_user = user_model.objects.get(pk=closed_by_user_id)
        recipients = user_model.objects.filter(pk__in=recipient_user_ids).exclude(pk=closed_by_user_id)

        context = {
            'ticket_title': ticket.title,
            'ticket_id': ticket.id,
            'closed_by': closed_by_user.get_full_name() or closed_by_user.email,
            'ticket_url': f"http://localhost:3000/dashboard/incidents/{ticket.id}",
        }

        subject = f'Ticket Closed: {ticket.title}'
        html_message = render_to_string('incidents/email/ticket_closure.html', context)
        plain_message = render_to_string('incidents/email/ticket_closure.txt', context)

        for recipient in recipients:
            send_mail(
                subject=subject,
                message=plain_message,
                html_message=html_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient.email],
                fail_silently=True,
            )

    except user_model.DoesNotExist:
        pass
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))

