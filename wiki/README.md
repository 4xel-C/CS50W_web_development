# Wiki

This simple website is designed to copy wikipedia functionnality:
- Create new pages
- Link pages between them
- Search functions
- Creation/Edition of text through .md format.

## Prerequisites

- Python 3.x installed
- pip (Python package installer)
- virtualenv (optional but recommended)
- Git (if you're cloning from a repository)

## Steps

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/your-django-project.git
cd your-django-project
```

### 2. Create a Virtual Environment (optional but recommended)

```bash
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install django
```

### 4. Apply Migrations

```bash
python manage.py migrate
```

### 5. Create a Superuser (Optional for Admin Access)

```bash
python manage.py createsuperuser
```

### 6. Run the Development Server

```bash
python manage.py runserver
```

Visit `http://127.0.0.1:8000/` in your browser to view the project.

## Notes

- To deactivate the virtual environment, run `deactivate`.
- For environment variables, consider using a `.env` file and `python-decouple` or `django-environ`.

## Troubleshooting

- If `pip install` fails, make sure you have the correct Python version and pip installed.
- If migrations fail, try `python manage.py makemigrations` first.
