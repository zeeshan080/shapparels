"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  sortOrder: number;
  isActive: boolean;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then(setCategories)
      .finally(() => setLoading(false));
  }, []);

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      description: formData.get("description") as string,
      sortOrder: parseInt(formData.get("sortOrder") as string) || 0,
    };

    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const newCat = await res.json();
      setCategories([...categories, newCat]);
      setShowNew(false);
      toast.success("Category created");
    } else {
      toast.error("Failed to create category");
    }
  };

  const handleUpdate = async (id: string, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      description: formData.get("description") as string,
      sortOrder: parseInt(formData.get("sortOrder") as string) || 0,
    };

    const res = await fetch(`/api/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const updated = await res.json();
      setCategories(categories.map((c) => (c.id === id ? updated : c)));
      setEditing(null);
      toast.success("Category updated");
    } else {
      toast.error("Failed to update category");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;

    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });

    if (res.ok) {
      setCategories(categories.filter((c) => c.id !== id));
      toast.success("Category deleted");
    } else {
      toast.error("Failed to delete category");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">{categories.length} categories</p>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {showNew && (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">New Category</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="new-name">Name *</Label>
                  <Input id="new-name" name="name" required onChange={(e) => {
                    const slugInput = document.getElementById("new-slug") as HTMLInputElement;
                    if (slugInput) slugInput.value = generateSlug(e.target.value);
                  }} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-slug">Slug *</Label>
                  <Input id="new-slug" name="slug" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-sort">Sort Order</Label>
                  <Input id="new-sort" name="sortOrder" type="number" defaultValue="0" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-desc">Description</Label>
                <Textarea id="new-desc" name="description" rows={2} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm">
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowNew(false)}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-center py-8 text-muted-foreground">Loading...</p>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No categories yet. Create your first category.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) =>
            editing === cat.id ? (
              <Card key={cat.id}>
                <CardContent className="pt-6">
                  <form onSubmit={(e) => handleUpdate(cat.id, e)} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input name="name" defaultValue={cat.name} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Slug</Label>
                        <Input name="slug" defaultValue={cat.slug} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Sort Order</Label>
                        <Input name="sortOrder" type="number" defaultValue={cat.sortOrder} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea name="description" defaultValue={cat.description || ""} rows={2} />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" size="sm">Save</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setEditing(null)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <div
                key={cat.id}
                className="flex items-center justify-between rounded-lg border border-border/50 p-4"
              >
                <div>
                  <p className="font-medium">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">
                    /{cat.slug} · Sort: {cat.sortOrder}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setEditing(cat.id)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
