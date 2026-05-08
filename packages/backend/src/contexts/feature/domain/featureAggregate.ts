import { FeatureId } from "./valueObject/featureId";
import { Name } from "./valueObject/name";
import { Description } from "./valueObject/description";
import { ProjectId } from "./valueObject/projectId";
import { Document } from "@shared/domain/entity/document";
import { DocumentId } from "@shared/domain/valueObject/documentId";

export class Feature {
  private readonly featureId: FeatureId;
  private readonly projectId: ProjectId;
  private name: Name;
  private description: Description;
  private documents: Document[];

  constructor(id: FeatureId, projectId: ProjectId, name: Name, description: Description, documents: Document[] = []) {
    this.featureId = id;
    this.projectId = projectId;
    this.name = name;
    this.description = description;
    this.documents = documents.filter(d => d != null);
  }

  getId(): FeatureId {
    return this.featureId;
  }

  getProjectId(): ProjectId {
    return this.projectId;
  }

  getName(): Name {
    return this.name;
  }

  getDescription(): Description {
    return this.description;
  }

  getDocuments(): Document[] {
    return [...this.documents];
  }

  addDocument(doc: Document): void {
    const alreadyExists = this.documents.some(d => d.getId().equals(doc.getId()));
    if (alreadyExists) return;
    this.documents.push(doc);
  }

  removeDocument(id: DocumentId): void {
    this.documents = this.documents.filter(d => !d.getId().equals(id));
  }
}