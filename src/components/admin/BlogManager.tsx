import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2 } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import he from "he";
import { apiClient } from '@/services/api';

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  createdAt: string;
  status: string;
  category?: string;
  featuredImage?: string;
}

const BlogManager = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    author: 'Admin', // will be auto-populated from logged-in admin if available
    category: '', // 
    featuredImage: "",
    status: 'published'
  });

  // Fetch blogs from backend
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await apiClient.getAllBlogsAdmin();
        setPosts(res.blogs || []);
      } catch (err) {
        console.error('Error fetching blogs:', err);
      }
    };
    fetchBlogs();
  }, []);

  // Slug generator
const generateSlug = (title: string) =>
  (title || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s\-]/g, "")  // ✅ keep hyphens
    .replace(/\s+/g, "-")           // spaces → hyphens
    .replace(/-+/g, "-")            // collapse multiple hyphens
    .replace(/^-+|-+$/g, "");       // trim edges

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
    const decodedContent = he.decode(formData.content || '');
    const payload = {
      ...formData,
      slug: generateSlug(formData.title), // ✅ force regenerate here
      category: formData.category || "General",
      content: decodedContent,
      featuredImage: {
      url: formData.featuredImage || "",
      alt: formData.title || "Blog image",
    },
    };
      if (editingPost) {
         console.log('Payload before sending:', payload);
        // update
        const updated = await apiClient.updateBlogAdmin(editingPost._id, payload);
        setPosts(posts.map((p) => (p._id === editingPost._id ? updated.blog : p)));
      } else {
        // create
        const created = await apiClient.createBlogAdmin(payload);
        setPosts([...posts, created.blog]);
      }
      // reset
      setFormData({ title: '', slug: '', excerpt: '', content: '', author: '', category: '', status: 'published' });
      setEditingPost(null);
      setShowForm(false);
    } catch (err: any) {
       if (err.response?.data?.errors) {
      // Backend validation errors (from express-validator)
      const messages = err.response.data.errors.map((e: any) => e.msg).join("\n");
      alert(messages); // 👉 or replace with a nice toast/alert component
    } else {
      console.error("Error saving blog:", err);
      alert("Something went wrong while saving the blog.");
    } 
      console.error('Error saving blog:', err);
    }
  };

  // Edit
const handleEdit = async (post: BlogPost) => {
  try {
    const res = await apiClient.getBlogByIdAdmin(post._id);
    const fullPost = res.blog;

    console.log("Fetched full blog:", fullPost);

    setEditingPost(fullPost);
    setFormData({
      title: fullPost.title || '',
      slug: fullPost.slug,
      excerpt: fullPost.excerpt,
      content: fullPost.content || "",
      author: fullPost.author || "Admin",
      featuredImage: fullPost.featuredImage?.url || "",
      category: fullPost.category || "",
      status: fullPost.status || "draft",
    });
    setShowForm(true);
  } catch (err) {
    console.error("Error fetching blog details:", err);
  }
};

  // Delete
  const handleDelete = async (id: string) => {
    try {
      await apiClient.deleteBlogAdmin(id);
      setPosts(posts.filter((p) => p._id !== id));
    } catch (err) {
      console.error('Error deleting blog:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-playfair font-bold">Blog Management</h2>
        <Button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={16} className="mr-2" />
          Add Post
        </Button>
      </div>

      {/* Blog Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingPost ? 'Edit Post' : 'Add New Post'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
	<Input
  	id="title"
  	value={formData.title}
  	onChange={(e) => {
    	const newTitle = e.target.value;
    	setFormData((prev) => ({
      	...prev,
      	title: newTitle,
      	slug: generateSlug(newTitle), // 👈 auto-generate slug
    	}));
  	}}
  	required
	/>
              </div>
              <div>
                <Label htmlFor="slug">Slug</Label>
	<Input
 	 id="slug"
  	value={formData.slug}
  	onChange={(e) =>
	setFormData((prev) => ({ ...prev, slug: e.target.value }))
	}
  	required
	/>
              </div>
              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <Input
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  required
                />
              </div>
  {/* Author */}
  <div>
    <Label htmlFor="author">Author Name</Label>
    <Input
      id="author"
      value={formData.author}
      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
      required
    />
  </div>

  {/* Featured Image */}
  <div>
    <Label htmlFor="featuredImage">Featured Image URL</Label>
    <Input
      id="featuredImage"
      value={formData.featuredImage || ''}
      onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
      placeholder="https://example.com/image.jpg"
    />
  </div>

  {/* Category */}
  <div>
    <Label htmlFor="category">Category</Label>
    <select
      id="category"
      value={formData.category || ''}
      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
      className="w-full border rounded p-2"
      required
    >
      <option value="">Select category</option>
      <option value="Health & Wellness">Health & Wellness</option>
      <option value="Sustainability">Sustainability</option>
      <option value="Products">Products</option>

    </select>
  </div>
              <div>
                <Label htmlFor="content">Content</Label>
                <ReactQuill
                  value={formData.content}
                  onChange={(value) => setFormData({ ...formData, content: value })}
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ list: 'ordered' }, { list: 'bullet' }],
                      ['link', 'image'],
                      ['clean']
                    ]
                  }}
                  theme="snow"
                />
              </div>
              <div className="flex space-x-2">
                <Button type="submit" className="btn-primary">
                  {editingPost ? 'Update' : 'Publish'} Post
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Blog Table */}
      <Card>
        <CardHeader>
          <CardTitle>Blog Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post._id}>
                  <TableCell>{post.title}</TableCell>
                  <TableCell>{post.author || 'Admin'}</TableCell>
                  <TableCell>{new Date(post.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{post.status}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(post)}>
                        <Edit size={14} />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(post._id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default BlogManager;
