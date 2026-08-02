from rest_framework import serializers
from .models import Book , Author, Category , Borrow

class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = '__all__'
        read_only_fields = ['is_active', 'created_by', 'updated_by']

    def validate(self, attrs):
        request = self.context.get('request')

        if request and request.method == 'POST':
            # author/category are optional on the model, so they may be absent from attrs.
            if Book.objects.filter(title=attrs.get('title'), author=attrs.get('author'), category=attrs.get('category'), is_active=True).exists():
                raise serializers.ValidationError({"error": "This Book Already Exists."})
        
        if request and request.method == 'PUT':
            if not self.instance:
                raise serializers.ValidationError({"error": "Data not found."})
            
            if 'title' not in attrs:
                attrs['title'] = self.instance.title

            if 'author' not in attrs:
                attrs['author'] = self.instance.author

            if 'category' not in attrs:
                attrs['category'] = self.instance.category

            if Book.objects.filter(title=attrs['title'], author=attrs['author'], category=attrs['category'],
                                is_active=True).exclude(pk=self.instance.pk).exists():
                raise serializers.ValidationError({"error": "This data clashes with the Book that already Exists. \
                                                Please change the title, author or category."})
        
        return attrs

class AuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Author
        fields = '__all__'
        read_only_fields = ['is_active', 'created_by', 'updated_by']

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'
        read_only_fields = ['is_active', 'created_by', 'updated_by']
        

class BorrowSerializer(serializers.ModelSerializer):
    class Meta:
        model = Borrow
        fields = '__all__'
        read_only_fields = ['borrow_date', 'due_date', 'return_date', 'status',
                            'is_active', 'submitted_by', 'verified_by']