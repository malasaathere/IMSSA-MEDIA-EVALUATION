import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { UploadCloud, CheckCircle2, Clock, MessageSquare, CheckSquare } from "lucide-react";

export function DesignerWorkspace() {
  const [files, setFiles] = useState<File[]>([]);
  const [checklist, setChecklist] = useState([
    { id: 1, text: "Check contrast ratios", checked: false },
    { id: 2, text: "Verify required dimensions", checked: false },
    { id: 3, text: "Ensure IMSSA branding is present", checked: false }
  ]);

  const onDrop = (acceptedFiles: File[]) => {
    setFiles([...files, ...acceptedFiles]);
  };
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className="flex h-screen flex-col bg-surface">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-white px-6 py-4">
        <div>
          <h1 className="text-2xl font-semibold text-navy-950">My Work</h1>
          <p className="text-sm text-text-muted">Designer & Editor Workspace</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 rounded-full border border-border bg-surface px-4 py-1.5">
            <span className="text-sm font-medium text-navy-950">Capacity: 1/3</span>
            <div className="h-2 w-16 overflow-hidden rounded-full bg-border">
              <div className="h-full w-1/3 bg-info transition-all" />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* Active Task Details */}
          <div className="col-span-1 lg:col-span-2 flex flex-col space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Opening Ceremony Poster</CardTitle>
                  <Badge variant="info">In Progress</Badge>
                </div>
                <CardDescription>Event 1 - Due Jul 22, 2026</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text">
                  Prepare the approved social-media sizes for the opening ceremony. Needs to include the new logo and modern typography.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="outline"><MessageSquare className="mr-1 h-3 w-3" /> Discussion (2)</Badge>
                  <Badge variant="outline"><CheckSquare className="mr-1 h-3 w-3" /> Brief</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Upload Area */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Draft</CardTitle>
                <CardDescription>Drag and drop your file here to submit for review.</CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  {...getRootProps()} 
                  className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center transition-colors cursor-pointer ${
                    isDragActive ? "border-focus bg-surface-selected" : "border-border hover:bg-surface"
                  }`}
                >
                  <input {...getInputProps()} />
                  <UploadCloud className="mb-4 h-10 w-10 text-navy-700" />
                  <p className="text-sm font-medium text-navy-950">
                    {isDragActive ? "Drop the files here" : "Click or drag files to upload"}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">Images up to 500MB, Video up to 5GB</p>
                </div>
                
                {files.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <h4 className="text-sm font-semibold text-navy-950">Pending Submission</h4>
                    {files.map((file, i) => (
                      <div key={i} className="flex items-center justify-between rounded-md border border-border bg-surface p-3">
                        <div className="flex items-center space-x-3">
                          <CheckCircle2 className="h-5 w-5 text-success" />
                          <span className="text-sm font-medium text-text">{file.name}</span>
                        </div>
                        <span className="text-xs text-text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                    ))}
                    <div className="flex justify-end pt-2">
                      <Button>Submit for Review</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Revision Checklist */}
          <div className="flex flex-col space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Revision Checklist</CardTitle>
                <CardDescription>Ensure these items are completed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {checklist.map(item => (
                  <div key={item.id} className="flex items-start space-x-3">
                    <input 
                      type="checkbox" 
                      className="mt-1 h-4 w-4 rounded border-border text-navy-900 focus:ring-focus"
                      checked={item.checked}
                      onChange={() => setChecklist(checklist.map(i => i.id === item.id ? { ...i, checked: !i.checked } : i))}
                    />
                    <span className={`text-sm ${item.checked ? 'text-text-muted line-through' : 'text-text'}`}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div className="flex items-start space-x-3">
                    <Clock className="mt-0.5 h-4 w-4 text-text-muted" />
                    <div>
                      <p className="font-medium text-navy-950">Assigned</p>
                      <p className="text-xs text-text-muted">Today at 10:00 AM</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <MessageSquare className="mt-0.5 h-4 w-4 text-text-muted" />
                    <div>
                      <p className="font-medium text-navy-950">Marketing Coordinator</p>
                      <p className="text-xs text-text-muted">Please prioritize this today.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
}
