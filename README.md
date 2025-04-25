# Laravel2ERD

A Node.js package that automatically generates Entity-Relationship Diagrams (ERD) for Laravel applications.

## Installation

```bash
npm install @priom7/laravel2erd
```

## Features

- 📊 Automatically analyze Laravel models to generate ERD diagrams
- 🔍 Detect table names, attributes, and data types
- 🔄 Map relationships between models
- 🖼️ Interactive web viewer with zoom controls
- 💾 Export diagrams as SVG

## Usage

After installation, you can generate an ERD diagram for your Laravel project:

```bash
# Generate an ERD with default settings
npx laravel2erd

# Customize the output
npx laravel2erd --output public/docs/erd --models app/Models --title "My Project ERD"
```

Once generated, you can view your ERD diagram at:

```
http://your-app-url/laravel2erd
```

## Options

- `-o, --output <directory>`: Output directory for ERD (default: `public/laravel2erd`)
- `-m, --models <directory>`: Models directory (default: `app/Models`)
- `-r, --relations`: Include relationships (default: `true`)
- `-t, --title <title>`: Diagram title (default: `Laravel ERD Diagram`)

## How It Works

Laravel2ERD analyzes your Laravel model files to extract:

1. **Table information**: Names and structure
2. **Attributes**: From fillable arrays and casts
3. **Relationships**: Including one-to-one, one-to-many, and many-to-many

It then generates a Mermaid-based diagram that visualizes your database structure.

## Example

```php
// app/Models/User.php
class User extends Model
{
    protected $fillable = [
        'name', 'email', 'password',
    ];
    
    protected $casts = [
        'email_verified_at' => 'datetime',
    ];
    
    public function posts()
    {
        return $this->hasMany(Post::class);
    }
}
```

Will be represented in the ERD diagram with proper relationships and attributes.

## License

MIT License - see LICENSE file for details.

## Author

Created by [priom7](https://github.com/priom7)