import { useBindableProjects } from '../../hooks/useBindables'
import type { PanelProps } from './panelProps'
import { fieldStyle, inputStyle, labelStyle, panelStyle } from './panelStyles'

export function ProjectCardPanel({ value, onChange }: PanelProps<'projectCard'>) {
  const { projects } = useBindableProjects()

  return (
    <div style={panelStyle}>
      <label style={fieldStyle}>
        <span style={labelStyle}>Project</span>
        <select
          style={inputStyle}
          value={value.projectId ?? ''}
          onChange={e => onChange({ projectId: e.target.value === '' ? null : e.target.value })}
        >
          <option value="">No project</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
