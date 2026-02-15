from django import forms
from .models import Organization
from django.core.validators import validate_email
from django.core.exceptions import ValidationError

class OrganizationForm(forms.ModelForm):
    admin_emails = forms.CharField(
        label='Admin Emails',
        widget=forms.Textarea(attrs={'rows': 3}),
        help_text='Comma-separated list of admin email addresses for this organization'
    )
    
    allowed_domains = forms.CharField(
        label='Allowed Domains',
        widget=forms.Textarea(attrs={'rows': 3}),
        help_text='Comma-separated list of allowed email domains for user registration'
    )
    
    class Meta:
        model = Organization
        fields = '__all__'

    def clean_admin_emails(self):
        admin_emails_field = self.cleaned_data.get('admin_emails')

        if not admin_emails_field:
            return admin_emails_field

        admin_emails = [email.strip() for email in admin_emails_field.split(',')]

        for email in admin_emails:
            try:
                validate_email(email)
            except ValidationError:
                raise ValidationError(f"Invalid email address: {email}")

        return admin_emails_field