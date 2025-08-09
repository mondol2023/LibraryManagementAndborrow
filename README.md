## Library Management And Borrow

# APIs ---------------------

# -- USERS -
- User Register - /api/register/
- User Login - /api/login/
- User penalty - /api/users/<id>/penalties/

# --BOOKS -
- Books CRUD - 
- /api/books/
- /api/books/<id>/

# --AUTHORS -
- Authors create and list - 
- /api/authors/

# --CATEGORIES -
- Categories create and list - 
- /api/categories/

# --BORROW -
- Borrow books (POST) - /api/borrow/
- Borrow data list (GET) - /api/borrow/
- Borrow verify - /api/borrow-verify/<borrow_id>/ - [out of requirements, this is an extra api for admin verification]
- Return books - /api/return/



These are the step-by-step process when a user requests to borrow a book:

Book ID Check

If book_id is missing in the request, return 404 error.

Determine Borrower

By default, borrowed_user is the authenticated user.

If the requester is an admin, they can borrow on behalf of another user, but must provide a valid user_id.

Atomic Transaction

Start a transaction.atomic() block to ensure that inventory updates and borrow creation happen together (avoiding race conditions).

Book Availability Check

Lock the book row (select_for_update) to prevent concurrent borrowing.

Ensure is_active=True and the book exists.

If not found, return 404 error.

Borrow Limit Check

Users can have max 3 active borrows (status="accepted", not returned, is_active=True).

Stock Check

If available_copies <= 0, return 400 error.

Borrow Record Creation

Prepare borrow data:

status = "pending"

borrow_date = today

due_date = today + 14 days

submitted_by = current user

is_active = False

If requester is admin:

Set status = "accepted"

Set verified_by = current user

Set is_active = True

Update Book Inventory

Decrease available_copies and total_copies by 1.

Create Borrow Entry

Save the borrow record with all prepared details.

Return Response

Serialize the borrow record and return it with 201 CREATED status.


***penalty points are created step-by-step:***

1. API Purpose
The endpoint is designed to view a user’s penalty points, not calculate or update them.

The route is likely something like:


GET /api/users/<pk>/penalties/
2. Access Control

if request.user.role != 'admin' and request.user.id != pk:
    return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)
If the request is not from an admin, the only person allowed to view the penalties is the user themselves.

An admin can see any user’s penalties.

3. Getting the User

user = get_object_or_404(User, pk=pk)
If the user with the given pk doesn’t exist, it returns a 404.

4. Getting the Penalty Points

penalty_points = getattr(user, 'penalty_points', 0)
Looks for an attribute named penalty_points on the User model instance.

If it’s missing, it defaults to 0 (meaning no penalties).

5. Returning the Data

serializer = PenaltySerializer(user)
return Response(serializer.data, status=status.HTTP_200_OK)
It serializes the entire user object (or at least the fields defined in PenaltySerializer).

Presumably, PenaltySerializer includes the penalty_points field.

6. How They’re Actually Increased
From the other code you posted earlier (ReturnBookView), penalty points increase when a book is returned late:

python
Copy
Edit
if borrow_record.return_date > borrow_record.due_date:
    days_late = (borrow_record.return_date - borrow_record.due_date).days
    borrow_record.user.penalty_points += days_late
    borrow_record.user.save()
1 day late = +1 penalty point

5 days late = +5 penalty points

They stay stored on the User record until something clears them.


