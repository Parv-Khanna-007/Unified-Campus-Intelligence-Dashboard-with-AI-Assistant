'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers';
import {
  BookOpen,
  Coffee,
  Calendar,
  FileText,
  Upload,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  Settings,
  ShieldCheck,
  FileUp,
} from 'lucide-react';
import { DashboardShell } from '@/components/dashboard-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminConsolePage() {
  const { user, token, isAuthenticated } = useAuth();
  const router = useRouter();

  // Protect route (check role)
  React.useEffect(() => {
    if (isAuthenticated && user?.role !== 'admin') {
      router.push('/');
    }
  }, [user, isAuthenticated, router]);

  const [activeTab, setActiveTab] = React.useState<'library' | 'cafeteria' | 'events' | 'handbooks'>('library');
  const [notification, setNotification] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // States for fetched lists
  const [books, setBooks] = React.useState<any[]>([]);
  const [events, setEvents] = React.useState<any[]>([]);
  const [cafeterias, setCafeterias] = React.useState<any>({});
  const [handbooks, setHandbooks] = React.useState<any[]>([]);
  const [isLoadingLists, setIsLoadingLists] = React.useState(false);

  // Forms states
  // 1. Library Form
  const [bookForm, setBookForm] = React.useState({
    title: '',
    authors: '',
    isbn: '',
    category: 'Computer Science',
    description: '',
    location: 'Shelf A-1',
    copies_available: 3,
    total_copies: 3,
  });

  // 2. Cafeteria Form
  const [cafeteriaForm, setCafeteriaForm] = React.useState({
    cafeteria_id: 'dining_hall_1',
    meal_type: 'lunch',
    item: '',
    price: 5.5,
    calories: 300,
    allergens: '',
  });

  // 3. Events Form
  const [eventForm, setEventForm] = React.useState({
    title: '',
    category: 'Technology',
    date: '',
    time: '',
    venue: '',
    description: '',
    speaker_or_host: '',
    capacity: 100,
  });

  // 4. Handbook Form
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = React.useState('');

  const fetchAllLists = async () => {
    setIsLoadingLists(true);
    setErrorMsg(null);
    try {
      // Fetch books
      const bRes = await fetch('https://ai-orchestrator-a2yg.onrender.com/books');
      if (bRes.ok) setBooks(await bRes.json());

      // Fetch menu
      const cRes = await fetch('https://ai-orchestrator-a2yg.onrender.com/menu');
      if (cRes.ok) setCafeterias(await cRes.json());

      // Fetch events
      const eRes = await fetch('https://ai-orchestrator-a2yg.onrender.com/events');
      if (eRes.ok) setEvents(await eRes.json());

      // Fetch handbooks
      const hRes = await fetch('https://ai-orchestrator-a2yg.onrender.com/documents');
      if (hRes.ok) setHandbooks(await hRes.json());
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to fetch resource databases. Ensure all FastAPI servers are online.');
    } finally {
      setIsLoadingLists(false);
    }
  };

  React.useEffect(() => {
    if (user?.role === 'admin') {
      fetchAllLists();
    }
  }, [user]);

  const showSuccess = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookForm.title || !bookForm.authors || !bookForm.isbn) {
      setErrorMsg('Please fill in Title, Authors, and ISBN fields.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('https://ai-orchestrator-a2yg.onrender.com/api/admin/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookForm),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to add book.');
      }

      showSuccess(`Book "${bookForm.title}" registered in Library database!`);
      setBookForm({
        title: '',
        authors: '',
        isbn: '',
        category: 'Computer Science',
        description: '',
        location: 'Shelf A-1',
        copies_available: 3,
        total_copies: 3,
      });
      fetchAllLists();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error adding book.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBook = async (isbn: string) => {
    setErrorMsg(null);
    try {
      const res = await fetch(`https://ai-orchestrator-a2yg.onrender.com/api/admin/books/${isbn}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete book.');
      showSuccess('Book deleted successfully.');
      fetchAllLists();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error deleting book.');
    }
  };

  const handleUpdateMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cafeteriaForm.item) {
      setErrorMsg('Please provide a menu item name.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const allergensList = cafeteriaForm.allergens
      ? cafeteriaForm.allergens.split(',').map((s) => s.trim())
      : [];

    try {
      const res = await fetch('https://ai-orchestrator-a2yg.onrender.com/api/admin/menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...cafeteriaForm,
          allergens: allergensList,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to update menu.');
      }

      showSuccess(`Menu updated: "${cafeteriaForm.item}" is on the schedule!`);
      setCafeteriaForm({
        ...cafeteriaForm,
        item: '',
        price: 5.5,
        calories: 300,
        allergens: '',
      });
      fetchAllLists();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating menu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title || !eventForm.date || !eventForm.venue) {
      setErrorMsg('Title, Date, and Venue are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('https://ai-orchestrator-a2yg.onrender.com/api/admin/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(eventForm),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to add event.');
      }

      showSuccess(`Event "${eventForm.title}" scheduled successfully!`);
      setEventForm({
        title: '',
        category: 'Technology',
        date: '',
        time: '',
        venue: '',
        description: '',
        speaker_or_host: '',
        capacity: 100,
      });
      fetchAllLists();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    setErrorMsg(null);
    try {
      const res = await fetch(`https://ai-orchestrator-a2yg.onrender.com/api/admin/events/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete event.');
      showSuccess('Event cancelled successfully.');
      fetchAllLists();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error cancelling event.');
    }
  };

  // Handbook upload handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setErrorMsg(null);
    }
  };

  const handleUploadPDF = async () => {
    if (!selectedFile) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    setUploadStatus('Uploading PDF file...');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      setUploadStatus('Extracting pages & generating embeddings...');
      const response = await fetch('https://ai-orchestrator-a2yg.onrender.com/upload-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to upload PDF.');
      }

      showSuccess('PDF uploaded, chunked and embedded successfully!');
      setSelectedFile(null);
      fetchAllLists();
    } catch (e: any) {
      setErrorMsg(e.message || 'Error uploading document.');
    } finally {
      setIsSubmitting(false);
      setUploadStatus('');
    }
  };

  const handleDeleteHandbook = async (id: number) => {
    try {
      const res = await fetch(`https://ai-orchestrator-a2yg.onrender.com/documents/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete document');
      showSuccess('Document removed from knowledge base.');
      fetchAllLists();
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to delete document.');
    }
  };

  const handlePreloadSample = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('https://ai-orchestrator-a2yg.onrender.com/preload-sample', {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to preload sample handbook');
      showSuccess('Sample academic handbook loaded and indexed!');
      fetchAllLists();
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to preload sample.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-rose-500 font-bold">
        Access Denied: Insufficient Permissions. Redirecting...
      </div>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
              <ShieldCheck className="h-7 w-7 text-primary" /> Admin Control Console
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Add books, adjust menus, schedule new activities, and manage RAG policy handbooks.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={fetchAllLists} disabled={isLoadingLists} className="h-8">
            <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isLoadingLists ? 'animate-spin' : ''}`} />
            Refresh Databases
          </Button>
        </div>

        {/* Status Alerts */}
        {notification && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg flex items-center gap-2 font-semibold text-xs animate-in fade-in duration-200">
            <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
            {notification}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg flex items-center gap-2 font-semibold text-xs animate-in fade-in duration-200">
            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Tab Selector row */}
        <div className="flex bg-muted/60 p-0.5 rounded-lg border border-border max-w-lg">
          {(['library', 'cafeteria', 'events', 'handbooks'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 text-[10px] sm:text-xs font-bold rounded-md capitalize transition-all ${
                activeTab === tab
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* 1. LIBRARY TAB */}
          {activeTab === 'library' && (
            <div className="grid gap-6 md:grid-cols-3">
              {/* Form Card */}
              <Card className="md:col-span-1 border-border bg-card/40">
                <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
                  <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                    <PlusCircle className="h-4 w-4 text-primary" /> Add Book to Catalog
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 text-xs">
                  <form onSubmit={handleAddBook} className="space-y-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-muted-foreground text-[9px] uppercase">Title</label>
                      <input
                        type="text"
                        value={bookForm.title}
                        onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-muted/65 hover:bg-muted border border-border rounded-lg text-xs"
                        placeholder="e.g. Clean Code"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-muted-foreground text-[9px] uppercase">Authors</label>
                      <input
                        type="text"
                        value={bookForm.authors}
                        onChange={(e) => setBookForm({ ...bookForm, authors: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-muted/65 hover:bg-muted border border-border rounded-lg text-xs"
                        placeholder="e.g. Robert C. Martin"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-muted-foreground text-[9px] uppercase">ISBN (13-digit)</label>
                      <input
                        type="text"
                        value={bookForm.isbn}
                        onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-muted/65 hover:bg-muted border border-border rounded-lg text-xs font-mono"
                        placeholder="e.g. 9780132350884"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="font-semibold text-muted-foreground text-[9px] uppercase">Shelf Location</label>
                        <input
                          type="text"
                          value={bookForm.location}
                          onChange={(e) => setBookForm({ ...bookForm, location: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-muted/65 hover:bg-muted border border-border rounded-lg text-xs"
                          placeholder="e.g. Shelf A-5"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-muted-foreground text-[9px] uppercase">Category</label>
                        <select
                          value={bookForm.category}
                          onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-muted/65 border border-border rounded-lg text-xs"
                        >
                          <option>Computer Science</option>
                          <option>Software Engineering</option>
                          <option>Mathematics</option>
                          <option>Literature</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-muted-foreground text-[9px] uppercase">Description</label>
                      <textarea
                        value={bookForm.description}
                        onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-muted/65 hover:bg-muted border border-border rounded-lg text-xs min-h-[60px]"
                        placeholder="Brief summary..."
                      />
                    </div>
                    <Button type="submit" disabled={isSubmitting} className="w-full text-xs font-semibold shadow-sm">
                      {isSubmitting ? 'Registering...' : 'Register Book'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* List Card */}
              <Card className="md:col-span-2 border-border bg-card/40">
                <CardHeader className="pb-3 border-b border-border/60 bg-muted/20 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xs font-bold">Current Catalog Inventory</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-[9px] px-1.5">{books.length} Books</Badge>
                </CardHeader>
                <CardContent className="pt-4 text-xs max-h-[420px] overflow-y-auto space-y-2">
                  {isLoadingLists ? (
                    <div className="space-y-2">
                      <Skeleton className="h-14 w-full" />
                      <Skeleton className="h-14 w-full" />
                      <Skeleton className="h-14 w-full" />
                    </div>
                  ) : books.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No books available.</div>
                  ) : (
                    books.map((book) => (
                      <div key={book.isbn} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card/60">
                        <div className="space-y-1">
                          <span className="font-bold text-foreground block">{book.title}</span>
                          <span className="text-[10px] text-muted-foreground block">by {book.authors} • ISBN: <code className="font-mono">{book.isbn}</code></span>
                          <div className="flex gap-2.5 mt-1">
                            <span className="text-[9px] font-semibold text-primary">{book.category}</span>
                            <span className="text-[9px] font-semibold text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">{book.location}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteBook(book.isbn)}
                          className="h-7 w-7 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* 2. CAFETERIA TAB */}
          {activeTab === 'cafeteria' && (
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="md:col-span-1 border-border bg-card/40">
                <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
                  <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                    <Coffee className="h-4 w-4 text-primary" /> Update Daily Specials
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 text-xs">
                  <form onSubmit={handleUpdateMenu} className="space-y-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-muted-foreground text-[9px] uppercase">Cafeteria Hub</label>
                      <select
                        value={cafeteriaForm.cafeteria_id}
                        onChange={(e) => setCafeteriaForm({ ...cafeteriaForm, cafeteria_id: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-muted/65 border border-border rounded-lg text-xs"
                      >
                        <option value="dining_hall_1">Dining Hall 1</option>
                        <option value="quad_cafe">Quad Cafe</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-muted-foreground text-[9px] uppercase">Meal Category</label>
                      <select
                        value={cafeteriaForm.meal_type}
                        onChange={(e) => setCafeteriaForm({ ...cafeteriaForm, meal_type: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-muted/65 border border-border rounded-lg text-xs"
                      >
                        <option value="breakfast">Breakfast</option>
                        <option value="lunch">Lunch</option>
                        <option value="dinner">Dinner</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-muted-foreground text-[9px] uppercase">Item Name</label>
                      <input
                        type="text"
                        value={cafeteriaForm.item}
                        onChange={(e) => setCafeteriaForm({ ...cafeteriaForm, item: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-muted/65 hover:bg-muted border border-border rounded-lg text-xs"
                        placeholder="e.g. Avocado Salmon Toast"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="font-semibold text-muted-foreground text-[9px] uppercase">Price ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={cafeteriaForm.price}
                          onChange={(e) => setCafeteriaForm({ ...cafeteriaForm, price: parseFloat(e.target.value) })}
                          className="w-full px-2.5 py-1.5 bg-muted/65 hover:bg-muted border border-border rounded-lg text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-muted-foreground text-[9px] uppercase">Calories</label>
                        <input
                          type="number"
                          value={cafeteriaForm.calories}
                          onChange={(e) => setCafeteriaForm({ ...cafeteriaForm, calories: parseInt(e.target.value) })}
                          className="w-full px-2.5 py-1.5 bg-muted/65 hover:bg-muted border border-border rounded-lg text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-muted-foreground text-[9px] uppercase">Allergens (comma separated)</label>
                      <input
                        type="text"
                        value={cafeteriaForm.allergens}
                        onChange={(e) => setCafeteriaForm({ ...cafeteriaForm, allergens: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-muted/65 hover:bg-muted border border-border rounded-lg text-xs"
                        placeholder="e.g. Gluten, Dairy, Soy"
                      />
                    </div>
                    <Button type="submit" disabled={isSubmitting} className="w-full text-xs font-semibold shadow-sm">
                      {isSubmitting ? 'Updating...' : 'Publish Item'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Menu Display Card */}
              <Card className="md:col-span-2 border-border bg-card/40 text-xs">
                <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
                  <CardTitle className="text-xs font-bold">Active Cafeteria Specials (Today)</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4 max-h-[420px] overflow-y-auto">
                  {isLoadingLists ? (
                    <div className="space-y-4">
                      <Skeleton className="h-28 w-full animate-pulse" />
                      <Skeleton className="h-28 w-full animate-pulse" />
                    </div>
                  ) : Object.keys(cafeterias).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No menu items found.</div>
                  ) : (
                    Object.entries(cafeterias).map(([cafId, data]: any) => (
                      <div key={cafId} className="border border-border/80 p-4 rounded-lg bg-card/60 space-y-3">
                        <span className="font-bold text-foreground text-xs font-mono uppercase tracking-wider block border-b border-border pb-1">
                          {cafId.replace(/_/g, ' ')}
                        </span>
                        <div className="grid gap-3 sm:grid-cols-3">
                          {['breakfast', 'lunch', 'dinner'].map((meal) => (
                            <div key={meal} className="space-y-1.5">
                              <span className="font-bold text-[10px] text-primary uppercase block">{meal}</span>
                              <div className="space-y-1">
                                {data.today[meal]?.map((item: any) => (
                                  <div key={item.item} className="p-2 bg-muted/30 rounded border border-border/40 text-[10px]">
                                    <span className="font-semibold text-foreground/80 block">{item.item}</span>
                                    <div className="flex items-center justify-between text-[9px] text-muted-foreground mt-1">
                                      <span>${item.price.toFixed(2)}</span>
                                      <span>{item.calories} kcal</span>
                                    </div>
                                    {item.allergens?.length > 0 && (
                                      <span className="text-[8px] text-red-500/80 block mt-0.5 truncate">Allergens: {item.allergens.join(', ')}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* 3. EVENTS TAB */}
          {activeTab === 'events' && (
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="md:col-span-1 border-border bg-card/40">
                <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
                  <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-primary" /> Schedule Campus Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 text-xs">
                  <form onSubmit={handleAddEvent} className="space-y-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-muted-foreground text-[9px] uppercase">Event Title</label>
                      <input
                        type="text"
                        value={eventForm.title}
                        onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-muted/65 hover:bg-muted border border-border rounded-lg text-xs"
                        placeholder="e.g. Summer AI Symposium"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="font-semibold text-muted-foreground text-[9px] uppercase">Category</label>
                        <select
                          value={eventForm.category}
                          onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-muted/65 border border-border rounded-lg text-xs"
                        >
                          <option>Technology</option>
                          <option>Academic</option>
                          <option>Career</option>
                          <option>Sports</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-muted-foreground text-[9px] uppercase">Capacity</label>
                        <input
                          type="number"
                          value={eventForm.capacity}
                          onChange={(e) => setEventForm({ ...eventForm, capacity: parseInt(e.target.value) })}
                          className="w-full px-2.5 py-1.5 bg-muted/65 hover:bg-muted border border-border rounded-lg text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="font-semibold text-muted-foreground text-[9px] uppercase">Date</label>
                        <input
                          type="date"
                          value={eventForm.date}
                          onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-muted/65 hover:bg-muted border border-border rounded-lg text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-muted-foreground text-[9px] uppercase">Time</label>
                        <input
                          type="text"
                          value={eventForm.time}
                          onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-muted/65 hover:bg-muted border border-border rounded-lg text-xs"
                          placeholder="e.g. 02:00 PM - 04:00 PM"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-muted-foreground text-[9px] uppercase">Venue Location</label>
                      <input
                        type="text"
                        value={eventForm.venue}
                        onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-muted/65 hover:bg-muted border border-border rounded-lg text-xs"
                        placeholder="e.g. Science Block Room 202"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-muted-foreground text-[9px] uppercase">Speaker / Host Entity</label>
                      <input
                        type="text"
                        value={eventForm.speaker_or_host}
                        onChange={(e) => setEventForm({ ...eventForm, speaker_or_host: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-muted/65 hover:bg-muted border border-border rounded-lg text-xs"
                        placeholder="e.g. ACM Student Chapter"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-muted-foreground text-[9px] uppercase">Event Description</label>
                      <textarea
                        value={eventForm.description}
                        onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-muted/65 hover:bg-muted border border-border rounded-lg text-xs min-h-[60px]"
                        placeholder="Provide abstract details..."
                      />
                    </div>
                    <Button type="submit" disabled={isSubmitting} className="w-full text-xs font-semibold shadow-sm">
                      {isSubmitting ? 'Scheduling...' : 'Schedule Event'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Events list display */}
              <Card className="md:col-span-2 border-border bg-card/40">
                <CardHeader className="pb-3 border-b border-border/60 bg-muted/20 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xs font-bold">Upcoming Scheduled Events</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-[9px] px-1.5">{events.length} Active Events</Badge>
                </CardHeader>
                <CardContent className="pt-4 text-xs max-h-[420px] overflow-y-auto space-y-2">
                  {isLoadingLists ? (
                    <div className="space-y-2">
                      <Skeleton className="h-14 w-full" />
                      <Skeleton className="h-14 w-full" />
                      <Skeleton className="h-14 w-full" />
                    </div>
                  ) : events.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No campus events planned.</div>
                  ) : (
                    events.map((ev) => (
                      <div key={ev.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card/60">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground">{ev.title}</span>
                            <Badge variant="outline" className="text-[8px] font-bold uppercase py-0">{ev.category}</Badge>
                          </div>
                          <span className="text-[10px] text-muted-foreground block">
                            Date: {ev.date} • Time: {ev.time} • Venue: <strong className="text-foreground/80">{ev.venue}</strong>
                          </span>
                          <span className="text-[10px] text-muted-foreground block">Host: {ev.speaker_or_host}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteEvent(ev.id)}
                          className="h-7 w-7 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* 4. HANDBOOKS RAG TAB */}
          {activeTab === 'handbooks' && (
            <Card className="border border-border/85 bg-card/40">
              <CardHeader className="flex flex-row items-center space-x-3 border-b border-border/80 pb-4">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xs font-bold">Academics Knowledge Base Indexer</CardTitle>
                  <CardDescription className="text-[10px]">
                    Index university regulatory handbook PDFs for semantic AI searches inside RAG assistant query channels.
                  </CardDescription>
                </div>
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreloadSample}
                    disabled={isSubmitting}
                    className="h-8 text-[10px]"
                  >
                    {isSubmitting && uploadStatus === '' ? (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        Seeding...
                      </>
                    ) : (
                      'Load Sample Excerpt'
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6 text-xs">
                {/* Upload Section */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-6 bg-muted/20 text-center hover:bg-muted/30 transition-colors relative">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      disabled={isSubmitting}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <FileUp className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="font-semibold text-foreground text-[11px] mb-1">
                      {selectedFile ? selectedFile.name : 'Select or drag Academic Handbook PDF'}
                    </span>
                    <p className="text-[9px] text-muted-foreground">
                      {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 'Supported formats: PDF (Max 10MB)'}
                    </p>
                  </div>

                  <div className="flex flex-col justify-center space-y-3">
                    <div className="space-y-1">
                      <span className="font-bold text-[10px] uppercase text-muted-foreground tracking-wider block">Admin Document Chunking</span>
                      <p className="text-[10px] text-muted-foreground">
                        Files are automatically split into overlapping windows (500 characters, 100 character overlap) and processed into vector embeddings.
                      </p>
                    </div>

                    <Button
                      onClick={handleUploadPDF}
                      disabled={!selectedFile || isSubmitting}
                      className="w-full sm:w-auto self-start shadow-sm font-semibold"
                    >
                      <Upload className="h-3.5 w-3.5 mr-2" />
                      {isSubmitting && uploadStatus !== '' ? uploadStatus : 'Index Document Chunks'}
                    </Button>
                  </div>
                </div>

                {/* Handbooks Indexed List */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <span className="font-bold text-[10px] uppercase text-muted-foreground tracking-wider block">Indexed Handbook Documents</span>
                  {isLoadingLists ? (
                    <div className="space-y-2">
                      <Skeleton className="h-12 w-full animate-pulse" />
                      <Skeleton className="h-12 w-full animate-pulse" />
                    </div>
                  ) : handbooks.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground border border-border rounded-lg bg-muted/10 font-semibold">
                      No handbook documents loaded. Upload a PDF or click 'Load Sample Excerpt' to begin.
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      {handbooks.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between border border-border/80 p-2.5 rounded-lg bg-muted/25 hover:bg-muted/45 transition-all">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <div>
                              <span className="font-semibold text-foreground text-[11px] font-mono block">{doc.filename}</span>
                              <span className="text-[9px] text-muted-foreground">Uploaded {new Date(doc.uploaded_at).toLocaleString()}</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteHandbook(doc.id)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
